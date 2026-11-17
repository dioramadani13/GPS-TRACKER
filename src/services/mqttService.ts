import mqtt, { MqttClient } from 'mqtt';
import { GpsTelemetry, MqttConfig } from '../types/telemetry';

export type MessageCallback = (topic: string, telemetry: GpsTelemetry, raw: string) => void;
export type StatusCallback = (status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR', error?: string) => void;

class MqttService {
  private client: MqttClient | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private currentConfig: MqttConfig | null = null;
  private isExplicitlyDisconnected = false;

  public connect(config: MqttConfig) {
    this.currentConfig = config;
    this.isExplicitlyDisconnected = false;

    if (this.client) {
      try {
        this.client.end(true);
      } catch (e) {
        console.warn('Error closing previous MQTT client:', e);
      }
      this.client = null;
    }

    this.notifyStatus('CONNECTING');

    try {
      const options: mqtt.IClientOptions = {
        clientId: config.clientId || `web_tracker_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 3000,
      };

      if (config.username) {
        options.username = config.username;
      }
      if (config.password) {
        options.password = config.password;
      }

      this.client = mqtt.connect(config.brokerUrl, options);

      this.client.on('connect', () => {
        this.notifyStatus('CONNECTED');
        if (this.client && config.topic) {
          this.client.subscribe(config.topic, { qos: 0 }, (err) => {
            if (err) {
              console.error('MQTT Subscription error on topic', config.topic, err);
            } else {
              console.log('Subscribed to MQTT topic:', config.topic);
            }
          });
        }
      });

      this.client.on('message', (topic, message) => {
        const rawString = message.toString();
        try {
          const parsed = JSON.parse(rawString);
          // Validate minimum fields
          if (typeof parsed === 'object' && parsed !== null) {
            this.notifyMessage(topic, parsed as GpsTelemetry, rawString);
          }
        } catch (err) {
          console.warn('Malformed JSON received on MQTT:', rawString, err);
        }
      });

      this.client.on('error', (err) => {
        console.error('MQTT Client Error:', err);
        this.notifyStatus('ERROR', err.message);
      });

      this.client.on('offline', () => {
        if (!this.isExplicitlyDisconnected) {
          this.notifyStatus('DISCONNECTED');
        }
      });

      this.client.on('reconnect', () => {
        this.notifyStatus('CONNECTING');
      });

      this.client.on('close', () => {
        if (!this.isExplicitlyDisconnected) {
          this.notifyStatus('DISCONNECTED');
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notifyStatus('ERROR', msg);
    }
  }

  public disconnect() {
    this.isExplicitlyDisconnected = true;
    if (this.client) {
      try {
        this.client.end(true);
      } catch (e) {
        console.warn('Error disconnecting MQTT client:', e);
      }
      this.client = null;
    }
    this.notifyStatus('DISCONNECTED');
  }

  public publish(topic: string, message: string) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message);
    }
  }

  public onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private notifyMessage(topic: string, telemetry: GpsTelemetry, raw: string) {
    this.messageCallbacks.forEach((cb) => cb(topic, telemetry, raw));
  }

  private notifyStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR', error?: string) {
    this.statusCallbacks.forEach((cb) => cb(status, error));
  }
}

export const mqttService = new MqttService();

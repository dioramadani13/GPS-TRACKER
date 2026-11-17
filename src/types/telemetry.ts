export interface GpsTelemetry {
  device_id: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null; // in km/h
  altitude?: number | null; // in meters
  battery_voltage?: number | null; // in Volts
  battery_percentage?: number | null; // 0 - 100%
  timestamp?: string; // ISO-8601
  satellites?: number;
  heading?: number | null; // 0 - 360 degrees
  hdop?: number | null;
  wifi_rssi?: number;
  gps_status?: 'FIXED' | 'SEARCHING' | 'NO_DATA' | string;
  gps_fix?: boolean;
  uptime_s?: number;
}

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'DISCONNECTED' | 'CONNECTING';

export type GpsFixStatus = 'FIX' | 'NO_FIX' | 'SEARCHING';

export interface MqttConfig {
  brokerUrl: string; // e.g. wss://broker.emqx.io:8084/mqtt
  topic: string; // e.g. telemetry/tracker
  clientId: string;
  username?: string;
  password?: string;
  useSsl: boolean;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  topic: string;
  payload: GpsTelemetry;
  rawString: string;
  status: 'valid' | 'invalid' | 'warning';
}

export interface BreadcrumbPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
}

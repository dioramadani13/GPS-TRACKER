/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { GpsMap } from './components/GpsMap';
import { SpeedWidget } from './components/SpeedWidget';
import { BatteryWidget } from './components/BatteryWidget';
import { GpsInfoWidget } from './components/GpsInfoWidget';
import { TelemetryLogModal } from './components/TelemetryLogModal';
import { MqttSettingsModal } from './components/MqttSettingsModal';
import {
  GpsTelemetry,
  ConnectionStatus,
  MqttConfig,
  TelemetryLogEntry,
  BreadcrumbPoint,
} from './types/telemetry';
import { mqttService } from './services/mqttService';
import {
  isValidGpsFix,
  calculateHaversineDistance,
  sanitizeSpeed,
} from './utils/haversine';

import { MQTT_CONFIG } from './config/mqtt';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('gps_tracker_theme') === 'dark' ||
      (!('gps_tracker_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Telemetry state - Murni real hardware (tanpa data simulasi)
  const [telemetry, setTelemetry] = useState<GpsTelemetry | null>(null);
  const [lastValidPosition, setLastValidPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [hasGpsFix, setHasGpsFix] = useState<boolean>(false);
  const [lastUpdateIso, setLastUpdateIso] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(0);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbPoint[]>([]);

  // MQTT Configuration state with localStorage persistence
  const [mqttConfig, setMqttConfig] = useState<MqttConfig>(() => {
    try {
      const saved = localStorage.getItem('mqtt_tracker_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.brokerUrl === 'string' && typeof parsed.topic === 'string') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved MQTT config:', e);
    }
    return MQTT_CONFIG;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // References for calculation without re-triggering effects
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastPacketTimeRef = useRef<number | null>(null);

  const handleSaveConfig = (newConfig: MqttConfig) => {
    try {
      localStorage.setItem('mqtt_tracker_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save MQTT config:', e);
    }
    setMqttConfig(newConfig);
    setConnectionStatus('CONNECTING');
    mqttService.connect(newConfig);
  };

  // Apply dark mode class to documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('gps_tracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('gps_tracker_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Process incoming telemetry packet from MQTT
  const handleIncomingTelemetry = useCallback(
    (payload: GpsTelemetry, topic: string = mqttConfig.topic, rawString?: string) => {
      const now = Date.now();
      lastPacketTimeRef.current = now;
      setLastUpdateIso(payload.timestamp || new Date(now).toISOString());

      // Check GPS fix validity: ESP32 sends gps_fix, gps_status, and coordinates
      const validFix =
        (payload.gps_fix === true || payload.gps_status === 'FIXED') &&
        isValidGpsFix(payload.latitude, payload.longitude);
      setHasGpsFix(validFix);

      // Only update marker position if coordinates are valid and not null.
      // If coordinates are null, lastValidPosition is preserved as the Last Known Position!
      if (validFix && payload.latitude !== null && payload.longitude !== null) {
        const newPos = { lat: payload.latitude, lng: payload.longitude };
        setLastValidPosition(newPos);

        // Distance accumulation
        if (prevPositionRef.current) {
          const dist = calculateHaversineDistance(
            prevPositionRef.current.lat,
            prevPositionRef.current.lng,
            newPos.lat,
            newPos.lng
          );
          if (dist > 0.001 && dist < 2.0) {
            setTotalDistanceKm((prev) => prev + dist);
          }
        }
        prevPositionRef.current = newPos;

        // Add to breadcrumb trail
        setBreadcrumbs((prev) => {
          const next = [
            ...prev,
            {
              lat: newPos.lat,
              lng: newPos.lng,
              timestamp: payload.timestamp || new Date().toISOString(),
              speed: sanitizeSpeed(payload.speed),
            },
          ];
          return next.slice(-80);
        });
      }

      // Speed tracking: only when speed is a valid number
      if (typeof payload.speed === 'number' && !isNaN(payload.speed)) {
        const cleanSpeed = sanitizeSpeed(payload.speed);
        if (cleanSpeed > maxSpeed) {
          setMaxSpeed(cleanSpeed);
        }
      }

      setTelemetry(payload);
      // Status ONLINE ditentukan murni berdasarkan diterimanya paket telemetry (bukan gps_status/koordinat)
      setConnectionStatus('ONLINE');

      // Append to logs
      const raw = rawString || JSON.stringify(payload);
      setLogs((prev) => [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          topic,
          payload,
          rawString: raw,
          status: validFix ? 'valid' : 'warning',
        },
        ...prev.slice(0, 99),
      ]);
    },
    [maxSpeed]
  );

  // Heartbeat monitoring for 15s timeout:
  // Perangkat ONLINE jika telemetry diterima dalam 15 detik terakhir, dan OFFLINE jika >15 detik
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (lastPacketTimeRef.current !== null) {
        const now = Date.now();
        const elapsed = now - lastPacketTimeRef.current;
        if (elapsed > 15000) {
          setConnectionStatus((current) => {
            if (current === 'ONLINE' || current === 'CONNECTING') {
              return 'OFFLINE';
            }
            return current;
          });
        } else {
          setConnectionStatus((current) => {
            if (current === 'OFFLINE') {
              return 'ONLINE';
            }
            return current;
          });
        }
      }
    }, 1000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  // Initialize and connect MQTT using configured broker settings
  useEffect(() => {
    const unsubMsg = mqttService.onMessage((topic, payload, raw) => {
      handleIncomingTelemetry(payload, topic, raw);
    });

    const unsubStatus = mqttService.onStatusChange((status) => {
      if (status === 'CONNECTED') {
        if (!lastPacketTimeRef.current) {
          setConnectionStatus('CONNECTING');
        }
      } else if (status === 'DISCONNECTED') {
        setConnectionStatus('DISCONNECTED');
      } else if (status === 'CONNECTING') {
        setConnectionStatus('CONNECTING');
      } else if (status === 'ERROR') {
        setConnectionStatus('DISCONNECTED');
      }
    });

    mqttService.connect(mqttConfig);

    return () => {
      unsubMsg();
      unsubStatus();
      mqttService.disconnect();
    };
  }, [handleIncomingTelemetry, mqttConfig]);

  return (
    <div className="min-h-screen overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-12">
      {/* Header dengan tombol pengaturan broker */}
      <Header
        connectionStatus={connectionStatus}
        lastUpdateTimestamp={lastUpdateIso}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Responsive Grid Layout
          - Mobile: Stacked (Map top ~350px, cards below)
          - Tablet (md): Map top ~500px, 3 cards in row below
          - PC (lg/xl): Split layout (Map ~65-70% on left, cards stacked on right)
      */}
      <main className="mobile-landscape-container flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="mobile-landscape-split grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 h-full">
          {/* Main Map Viewport */}
          <div className="mobile-landscape-map lg:col-span-7 xl:col-span-8 flex flex-col h-[340px] sm:h-[420px] md:h-[500px] lg:h-[calc(100vh-130px)] lg:min-h-[580px]">
            <GpsMap
              telemetry={telemetry}
              lastValidPosition={lastValidPosition}
              hasGpsFix={hasGpsFix}
              isOnline={connectionStatus === 'ONLINE'}
              breadcrumbs={breadcrumbs}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Telemetry Cards Area:
              - Mobile Portrait: 1 column vertical stack
              - Mobile Landscape: Compact scrollable column side-by-side with map
              - Tablet (md to lg): 3 columns horizontal grid
              - PC (lg+): 1 column vertical sidebar stack
          */}
          <div className="mobile-landscape-sidebar lg:col-span-5 xl:col-span-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-3.5 sm:gap-4 auto-rows-min">
            {/* Speed Card */}
            <SpeedWidget speed={telemetry?.speed} />

            {/* Battery Card */}
            <BatteryWidget
              batteryPercentage={telemetry?.battery_percentage}
              batteryVoltage={telemetry?.battery_voltage}
            />

            {/* GPS Info & Coordinates Card */}
            <GpsInfoWidget
              telemetry={telemetry}
              lastValidPosition={lastValidPosition}
              hasGpsFix={hasGpsFix}
              totalDistanceKm={totalDistanceKm}
              lastUpdateIso={lastUpdateIso}
            />
          </div>
        </div>
      </main>

      {/* Raw MQTT JSON Logs Modal - Inspector Paket Realtime */}
      <TelemetryLogModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Menu Modal Pengaturan Broker MQTT */}
      <MqttSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentConfig={mqttConfig}
        defaultConfig={MQTT_CONFIG}
        onSave={handleSaveConfig}
      />
    </div>
  );
}

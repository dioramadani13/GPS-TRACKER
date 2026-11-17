import { useState } from 'react';
import { Compass, MapPin, Satellite, Mountain, Navigation, Copy, Check, ExternalLink, Wifi, Clock, Activity, AlertCircle } from 'lucide-react';
import { GpsTelemetry } from '../types/telemetry';
import { formatTimeAgo } from '../utils/haversine';

interface GpsInfoWidgetProps {
  telemetry: GpsTelemetry | null;
  lastValidPosition: { lat: number; lng: number } | null;
  hasGpsFix: boolean;
  totalDistanceKm: number;
  lastUpdateIso?: string | null;
}

function formatUptime(seconds?: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}j ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function GpsInfoWidget({
  telemetry,
  lastValidPosition,
  hasGpsFix,
  totalDistanceKm,
  lastUpdateIso,
}: GpsInfoWidgetProps) {
  const [copied, setCopied] = useState(false);

  const lat = lastValidPosition?.lat;
  const lng = lastValidPosition?.lng;
  const altitude = typeof telemetry?.altitude === 'number' ? telemetry.altitude : null;
  const satellites = typeof telemetry?.satellites === 'number' ? telemetry.satellites : null;
  const heading = typeof telemetry?.heading === 'number' ? telemetry.heading : null;

  // Status GPS terpisah: FIXED, SEARCHING, atau NO_DATA
  const rawStatus = (telemetry?.gps_status || (hasGpsFix ? 'FIXED' : 'SEARCHING')).toUpperCase();
  const isGpsFixed = rawStatus === 'FIXED';
  const isSearching = rawStatus === 'SEARCHING';
  const isNoData = rawStatus === 'NO_DATA';

  // Indikator apakah koordinat di layar adalah realtime atau posisi terakhir
  const isLiveCoord = isGpsFixed && telemetry?.latitude !== null && telemetry?.longitude !== null;
  const isLastKnownCoord = !isLiveCoord && lastValidPosition !== null;

  // Calculate compass cardinal direction
  const getCardinal = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  const handleCopyCoords = () => {
    if (lat !== undefined && lng !== undefined) {
      navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getGpsStatusBadge = () => {
    if (isGpsFixed) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <Satellite className="w-3 h-3" />
          <span>FIXED {satellites !== null ? `(${satellites} Sats)` : ''}</span>
        </div>
      );
    }
    if (isNoData) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3" />
          <span>NO_DATA</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <Satellite className="w-3 h-3" />
        <span>SEARCHING</span>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm transition-all space-y-3">
      {/* Header with GPS Status (Requirement: Indikator terpisah FIXED, SEARCHING, NO_DATA) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            GPS Telemetry
          </span>
        </div>

        {/* Dedicated GPS_STATUS Badge */}
        {getGpsStatusBadge()}
      </div>

      {/* Primary Coordinates Grid */}
      <div className="space-y-2">
        <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          {/* Posisi Terakhir / Live indicator label */}
          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Koordinat Lokasi:
            </span>
            {isLiveCoord ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Posisi Realtime
              </span>
            ) : isLastKnownCoord ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" title="Koordinat saat GPS terakhir kali terkunci">
                Posisi Terakhir
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                Belum Terdeteksi
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Latitude:
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tabular-nums">
              {lat !== undefined ? lat.toFixed(6) : '--'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Longitude:
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm tabular-nums">
              {lng !== undefined ? lng.toFixed(6) : '--'}
            </span>
          </div>
        </div>

        {/* Action button: Copy coordinates & OSM link */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {isLastKnownCoord ? '(Menampilkan koordinat terakhir yang valid)' : ''}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lat !== undefined && lng !== undefined && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Lihat OSM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={handleCopyCoords}
              disabled={lat === undefined || lng === undefined}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Altitude, Heading, Total Distance */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
        <div className="p-1.5 sm:p-2 rounded bg-slate-50/70 dark:bg-slate-800/30">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
            <Mountain className="w-3 h-3 text-emerald-500" />
            <span>Ketinggian</span>
          </div>
          <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 tabular-nums truncate">
            {altitude !== null ? `${altitude.toFixed(1)} m` : '--'}
          </div>
        </div>

        <div className="p-1.5 sm:p-2 rounded bg-slate-50/70 dark:bg-slate-800/30">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
            <Compass className="w-3 h-3 text-blue-500" />
            <span>Heading</span>
          </div>
          <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 tabular-nums truncate">
            {heading !== null ? `${heading.toFixed(0)}° ${getCardinal(heading)}` : '--'}
          </div>
        </div>

        <div className="p-1.5 sm:p-2 rounded bg-slate-50/70 dark:bg-slate-800/30">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
            <Navigation className="w-3 h-3 text-amber-500" />
            <span>Jarak Tempuh</span>
          </div>
          <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 tabular-nums truncate">
            {totalDistanceKm.toFixed(2)} km
          </div>
        </div>
      </div>

      {/* Device Telemetry System Footer (wifi_rssi, uptime_s, last update time) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-3 gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        {/* WiFi RSSI */}
        <div className="flex items-center justify-center gap-1 bg-slate-50/50 dark:bg-slate-800/20 py-1 px-1.5 rounded truncate" title="Kekuatan Sinyal WiFi ESP32">
          <Wifi className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {typeof telemetry?.wifi_rssi === 'number' ? `${telemetry.wifi_rssi} dBm` : '--'}
          </span>
        </div>

        {/* Uptime ESP32 */}
        <div className="flex items-center justify-center gap-1 bg-slate-50/50 dark:bg-slate-800/20 py-1 px-1.5 rounded truncate" title="Waktu Nyala ESP32">
          <Clock className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {formatUptime(telemetry?.uptime_s)}
          </span>
        </div>

        {/* Last Packet Update */}
        <div className="flex items-center justify-center gap-1 bg-slate-50/50 dark:bg-slate-800/20 py-1 px-1.5 rounded truncate" title="Waktu Paket Diterima">
          <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {lastUpdateIso ? formatTimeAgo(lastUpdateIso) : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}

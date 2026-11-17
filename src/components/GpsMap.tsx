import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Locate, Layers, ShieldAlert } from 'lucide-react';
import { GpsTelemetry, BreadcrumbPoint } from '../types/telemetry';
import { sanitizeSpeed } from '../utils/haversine';

interface GpsMapProps {
  telemetry: GpsTelemetry | null;
  lastValidPosition: { lat: number; lng: number } | null;
  hasGpsFix: boolean;
  isOnline: boolean;
  breadcrumbs: BreadcrumbPoint[];
  isDarkMode: boolean;
}

export function GpsMap({
  telemetry,
  lastValidPosition,
  hasGpsFix,
  isOnline,
  breadcrumbs,
}: GpsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [mapStyle, setMapStyle] = useState<'standard' | 'carto'>('standard');
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [userHasMovedMap, setUserHasMovedMap] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial center: if lastValidPosition exists use it, otherwise show broad region without pin
    const initialLat = lastValidPosition ? lastValidPosition.lat : -2.5489;
    const initialLng = lastValidPosition ? lastValidPosition.lng : 118.0149;
    const initialZoom = lastValidPosition ? 15 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Add zoom control at top-right
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    // Initial tile layer
    const tileUrl =
      mapStyle === 'carto'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        mapStyle === 'carto'
          ? '&copy; <a href="https://carto.com/">CARTO</a>'
          : '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapInstanceRef.current = map;

    // Detect user manual interaction with map
    map.on('dragstart', () => {
      setUserHasMovedMap(true);
    });

    // Breadcrumb polyline
    const polyline = L.polyline([], {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.85,
      smoothFactor: 1,
      dashArray: '6, 6',
    }).addTo(map);
    polylineRef.current = polyline;

    // Automatic resize observer and orientation change listeners for Phone (Portrait/Landscape), Tablet, and PC
    const triggerMapResize = () => {
      map.invalidateSize();
    };

    const handleOrientationChange = () => {
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 60);
      setTimeout(() => map.invalidateSize(), 250);
      setTimeout(() => map.invalidateSize(), 500);
    };

    const resizeObserver = new ResizeObserver(() => {
      triggerMapResize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle tile switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const tileUrl =
      mapStyle === 'carto'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        mapStyle === 'carto'
          ? '&copy; <a href="https://carto.com/">CARTO</a>'
          : '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Recenter helper
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current || !lastValidPosition) return;
    mapInstanceRef.current.flyTo([lastValidPosition.lat, lastValidPosition.lng], 16, {
      animate: true,
      duration: 0.8,
    });
    setUserHasMovedMap(false);
  }, [lastValidPosition]);

  // Update marker & polyline when telemetry or lastValidPosition changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!lastValidPosition) return;

    const { lat, lng } = lastValidPosition;
    const heading = typeof telemetry?.heading === 'number' ? telemetry.heading : 0;
    const speed = sanitizeSpeed(telemetry?.speed);
    const isLivePosition = hasGpsFix && telemetry?.latitude !== null && telemetry?.longitude !== null;

    const markerBorderClass = isLivePosition 
      ? (isOnline ? 'border-blue-400' : 'border-slate-500') 
      : 'border-amber-400 shadow-amber-500/30';
    const markerIconColor = isLivePosition 
      ? (isOnline ? 'text-blue-400' : 'text-slate-400') 
      : 'text-amber-400';
    const pulseRing = isOnline 
      ? (isLivePosition 
          ? '<div class="absolute inset-0 rounded-full bg-blue-500/25 gps-pulse-ring"></div>' 
          : '<div class="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse"></div>') 
      : '';

    // Create custom vehicle/tracker icon
    const iconHtml = `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5">
        ${pulseRing}
        <div class="relative z-10 w-9 h-9 rounded-full bg-slate-900 border-2 ${markerBorderClass} shadow-lg flex items-center justify-center transition-transform duration-300" style="transform: rotate(${heading}deg);">
          <svg class="w-5 h-5 ${markerIconColor}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-gps-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const popupContent = `
      <div class="text-xs space-y-1.5 p-1 min-w-[200px]">
        <div class="flex items-center justify-between border-b border-slate-700 pb-1 font-semibold text-slate-200">
          <span>GPS Tracker</span>
          <div class="flex items-center gap-1">
            <span class="text-[10px] px-1.5 py-0.5 rounded ${isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}">
              ${isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded ${isLivePosition ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
              ${isLivePosition ? 'LIVE' : 'LAST KNOWN'}
            </span>
          </div>
        </div>
        ${!isLivePosition ? '<div class="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded leading-tight">Posisi terakhir tercatat (GPS sedang mencari sinyal)</div>' : ''}
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300 pt-0.5">
          <span class="text-slate-400">Latitude:</span>
          <span class="font-mono text-right font-medium">${lat.toFixed(6)}</span>
          <span class="text-slate-400">Longitude:</span>
          <span class="font-mono text-right font-medium">${lng.toFixed(6)}</span>
          <span class="text-slate-400">Speed:</span>
          <span class="font-mono text-right font-medium">${telemetry?.speed !== null && telemetry?.speed !== undefined ? `${speed} km/h` : '--'}</span>
          <span class="text-slate-400">Altitude:</span>
          <span class="font-mono text-right font-medium">${telemetry?.altitude !== null && telemetry?.altitude !== undefined ? `${telemetry.altitude.toFixed(1)} m` : '--'}</span>
        </div>
        <div class="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1 text-right font-mono">
          ${telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    `;

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
      marker.bindPopup(popupContent);
      markerRef.current = marker;
      mapInstanceRef.current.setView([lat, lng], 16);
    } else {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(customIcon);
      markerRef.current.setPopupContent(popupContent);
    }

    // Auto-pan if user has not panned manually
    if (!userHasMovedMap) {
      mapInstanceRef.current.panTo([lat, lng], {
        animate: true,
        duration: 0.5,
      });
    }

    // Update polyline trail
    if (polylineRef.current && breadcrumbs.length > 0) {
      const latLngs = breadcrumbs.map((b) => [b.lat, b.lng] as [number, number]);
      polylineRef.current.setLatLngs(latLngs);
    }
  }, [telemetry, lastValidPosition, isOnline, userHasMovedMap, breadcrumbs]);

  return (
    <div className="relative w-full h-full min-h-[320px] sm:min-h-[400px] md:min-h-[460px] lg:min-h-[580px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Indicator when GPS has No Fix, Searching, or No Data */}
      {!hasGpsFix && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-amber-500/95 text-slate-950 font-medium text-[11px] sm:text-xs shadow-lg backdrop-blur-sm animate-pulse max-w-[85%] sm:max-w-none">
          <ShieldAlert className="w-4 h-4 shrink-0 text-slate-950" />
          <div className="flex flex-col">
            <span className="font-bold uppercase tracking-wider text-[11px]">
              GPS: {telemetry?.gps_status || 'SEARCHING'}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-950/90 leading-tight">
              {lastValidPosition 
                ? 'Menampilkan posisi terakhir yang tercatat (bukan posisi realtime)' 
                : 'Menunggu satelit mengunci sinyal koordinat...'}
            </span>
          </div>
        </div>
      )}

      {/* Floating Map Controls at Top Left */}
      <div className="absolute top-3 right-12 sm:top-4 sm:right-14 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setMapStyle(mapStyle === 'standard' ? 'carto' : 'standard')}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
          title="Switch Tile Style"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{mapStyle === 'standard' ? 'Carto Voyager' : 'OpenStreetMap'}</span>
        </button>
      </div>

      {/* Recenter Map Button (Requirement FR-002: Bottom Right) */}
      <div className="absolute bottom-4 right-3 sm:bottom-6 sm:right-4 z-20 flex flex-col gap-1.5 sm:gap-2">
        {userHasMovedMap && (
          <div className="text-[10px] sm:text-[11px] bg-slate-900/80 text-slate-300 px-2 py-0.5 sm:py-1 rounded shadow backdrop-blur-sm text-center">
            Panned away
          </div>
        )}
        <button
          type="button"
          onClick={handleRecenter}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg hover:shadow-xl transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-[44px]"
          title="Recenter view to current tracker position"
        >
          <Locate className="w-4 h-4 text-white" />
          <span>Recenter Map</span>
        </button>
      </div>

      {/* Bottom Left GPS Coordinates Monospace Pill */}
      {lastValidPosition && (
        <div className="absolute bottom-4 left-3 sm:left-4 z-20 hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 font-mono tabular-nums shadow-md">
          {(!hasGpsFix || telemetry?.latitude === null) && (
            <span className="text-amber-400 font-sans font-semibold text-[10px] uppercase bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded">
              Posisi Terakhir
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">LAT:</span>
            <span>{lastValidPosition.lat.toFixed(6)}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">LNG:</span>
            <span>{lastValidPosition.lng.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate distance in kilometers between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Validates whether GPS coordinates are within realistic bounds and not 0.0 or null
 */
export function isValidGpsFix(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }
  // 0.0, 0.0 is null island, typical indicator of GPS receiver with no satellite fix
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

/**
 * Filter speed to eliminate GPS drift (< 0.5 km/h returns 0.0)
 */
export function sanitizeSpeed(speed: number | null | undefined): number {
  if (typeof speed !== 'number' || isNaN(speed) || speed < 0.5) {
    return 0.0;
  }
  return parseFloat(speed.toFixed(1));
}

/**
 * Check if battery voltage is within physically valid Li-ion 18650 sensor ranges (2.0V - 4.5V)
 */
export function isValidBatteryVoltage(voltage: number): boolean {
  if (isNaN(voltage)) return false;
  return voltage >= 2.0 && voltage <= 4.5;
}

/**
 * Calculates battery SoC percentage from measured Li-ion 18650 voltage (3.3V - 4.2V)
 */
export function voltageToPercentage(voltage: number): number {
  if (isNaN(voltage) || voltage < 2.5) return 0;
  if (voltage >= 4.20) return 100;
  if (voltage <= 3.30) return 0;
  const pct = ((voltage - 3.30) / (4.20 - 3.30)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Convert battery percentage to color badge / theme
 * Rule from PRD:
 * > 50% -> Green
 * 20% - 50% -> Yellow / Amber
 * < 20% -> Red
 */
export function getBatteryTier(percentage: number): {
  color: 'emerald' | 'amber' | 'rose';
  label: 'Normal' | 'Moderate' | 'Critical';
  bgClass: string;
  textClass: string;
  fillClass: string;
  borderClass: string;
} {
  if (percentage > 50) {
    return {
      color: 'emerald',
      label: 'Normal',
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      fillClass: 'bg-emerald-500',
      borderClass: 'border-emerald-500/30',
    };
  }
  if (percentage >= 20) {
    return {
      color: 'amber',
      label: 'Moderate',
      bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
      textClass: 'text-amber-600 dark:text-amber-400',
      fillClass: 'bg-amber-500',
      borderClass: 'border-amber-500/30',
    };
  }
  return {
    color: 'rose',
    label: 'Critical',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/20',
    textClass: 'text-rose-600 dark:text-rose-400',
    fillClass: 'bg-rose-500',
    borderClass: 'border-rose-500/30',
  };
}

/**
 * Formats relative time (e.g., "3 seconds ago")
 */
export function formatTimeAgo(timestampStr: string): string {
  try {
    const timestamp = new Date(timestampStr).getTime();
    if (isNaN(timestamp)) return 'Just now';
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));

    if (diffSec < 2) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  } catch {
    return 'Just now';
  }
}

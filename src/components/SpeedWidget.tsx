import { Gauge } from 'lucide-react';
import { sanitizeSpeed } from '../utils/haversine';

interface SpeedWidgetProps {
  speed: number | null | undefined;
  maxSpeed?: number;
}

export function SpeedWidget({ speed }: SpeedWidgetProps) {
  const hasSpeed = typeof speed === 'number' && !isNaN(speed);
  const currentSpeed = hasSpeed ? sanitizeSpeed(speed) : null;
  const maxScale = 120; // 120 km/h gauge max
  const speedPercentage = currentSpeed !== null ? Math.min(100, Math.round((currentSpeed / maxScale) * 100)) : 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Gauge className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Speed
          </span>
        </div>
      </div>

      {/* Main Metric Typography */}
      <div className="pt-3 sm:pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono tabular-nums ${
            currentSpeed !== null ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
          }`}>
            {currentSpeed !== null ? currentSpeed.toFixed(1) : '--'}
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-400 dark:text-slate-500">
            km/h
          </span>
        </div>
      </div>

      {/* Visual Speed Progress Gauge Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${Math.max(2, speedPercentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>0</span>
          <span>60</span>
          <span>120 km/h</span>
        </div>
      </div>
    </div>
  );
}

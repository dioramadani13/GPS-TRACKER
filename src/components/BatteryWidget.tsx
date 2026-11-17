import { Battery, AlertTriangle, Zap } from 'lucide-react';
import { getBatteryTier, isValidBatteryVoltage, voltageToPercentage } from '../utils/haversine';

interface BatteryWidgetProps {
  batteryPercentage: number | null | undefined;
  batteryVoltage: number | null | undefined;
}

export function BatteryWidget({ batteryPercentage, batteryVoltage }: BatteryWidgetProps) {
  // Hanya proses jika ada data hardware asli (bukan simulasi)
  const hasVoltage = typeof batteryVoltage === 'number' && !isNaN(batteryVoltage) && batteryVoltage > 0;
  const hasExplicitPercentage = typeof batteryPercentage === 'number' && !isNaN(batteryPercentage);
  const hasData = hasExplicitPercentage || hasVoltage;

  const voltage = hasVoltage ? batteryVoltage : null;
  const isVoltageValid = voltage !== null ? isValidBatteryVoltage(voltage) : true;
  
  // Jika ESP32 mengirim voltage, hitung otomatis SoC % untuk baterai Li-ion 18650
  const percentage = hasExplicitPercentage
    ? Math.max(0, Math.min(100, Math.round(batteryPercentage)))
    : (voltage !== null && isVoltageValid ? voltageToPercentage(voltage) : null);
  
  const tier = percentage !== null ? getBatteryTier(percentage) : null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm transition-all">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tier ? `${tier.bgClass} ${tier.textClass}` : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
            <Battery className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Battery & Power
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!hasData ? (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              --
            </span>
          ) : !isVoltageValid ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              <span>Invalid Voltage</span>
            </span>
          ) : (
            tier && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${tier.bgClass} ${tier.textClass}`}>
                {tier.label}
              </span>
            )
          )}
        </div>
      </div>

      {/* Main Metric Percentage */}
      <div className="pt-3 sm:pt-4 pb-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono tabular-nums ${
              percentage !== null ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
            }`}>
              {percentage !== null ? percentage : '--'}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500">%</span>
          </div>

          {/* Voltage display */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-slate-400 dark:text-slate-500 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Voltage</span>
            </div>
            <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              voltage !== null ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
            }`}>
              {voltage !== null ? (isVoltageValid ? `${voltage.toFixed(2)} V` : 'ERR') : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Battery Bar Indicator */}
      <div className="space-y-1.5 pt-2">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60 flex items-center">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              tier ? tier.fillClass : 'bg-transparent'
            }`}
            style={{ width: `${percentage !== null ? Math.max(4, percentage) : 0}%` }}
          />
        </div>

        {/* 4-cell segment marks */}
        <div className="grid grid-cols-4 text-[10px] text-slate-400 dark:text-slate-600 font-mono text-center pt-0.5">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

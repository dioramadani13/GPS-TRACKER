import { WifiOff, RefreshCw, Sun, Moon, Radio, Terminal, Settings } from 'lucide-react';
import { ConnectionStatus } from '../types/telemetry';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  lastUpdateTimestamp?: string | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenLogs: () => void;
  onOpenSettings: () => void;
}

export function Header({
  connectionStatus,
  isDarkMode,
  onToggleTheme,
  onOpenLogs,
  onOpenSettings,
}: HeaderProps) {
  // Connection status badge styling (FR-006)
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'ONLINE':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </div>
        );
      case 'OFFLINE':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] sm:text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
            <span>OFFLINE</span>
          </div>
        );
      case 'DISCONNECTED':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 text-[11px] sm:text-xs font-semibold tracking-wide">
            <WifiOff className="w-3 h-3" />
            <span className="hidden xs:inline">DISCONNECTED</span>
            <span className="xs:hidden">DISC</span>
          </div>
        );
      case 'CONNECTING':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] sm:text-xs font-semibold tracking-wide">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span className="hidden xs:inline">CONNECTING</span>
            <span className="xs:hidden">CONN</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 transition-all">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            IoT GPS Tracker
          </h1>
        </div>

        {/* Center / Status Zone */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Connection Status Badge (Requirement FR-006) */}
          {getStatusBadge()}
        </div>

        {/* Action Controls Zone */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* MQTT JSON Telemetry Logs */}
          <button
            type="button"
            onClick={onOpenLogs}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
            title="Inspect Raw MQTT Telemetry Stream"
          >
            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* MQTT Broker Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
            title="Pengaturan Broker MQTT"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { X, Terminal, Trash2, Copy, Check, Download, ShieldCheck } from 'lucide-react';
import { TelemetryLogEntry } from '../types/telemetry';

interface TelemetryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TelemetryLogEntry[];
  onClearLogs: () => void;
}

export function TelemetryLogModal({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}: TelemetryLogModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<TelemetryLogEntry | null>(logs[0] || null);

  if (!isOpen) return null;

  const handleCopyRaw = (log: TelemetryLogEntry) => {
    navigator.clipboard.writeText(log.rawString);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gps_telemetry_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>MQTT Telemetry Stream</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {logs.length}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Live JSON payloads received via MQTT WebSocket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-500/10 disabled:opacity-40"
              title="Clear Stream"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split: List on Left, Detail Viewer on Right */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {/* Packet List */}
          <div className="overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No telemetry packets received yet. Waiting for MQTT stream...
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-200 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {log.topic}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      Speed: {log.payload.speed} km/h · Bat: {log.payload.battery_percentage}% ({log.payload.battery_voltage}V)
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* JSON Inspector */}
          <div className="overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 flex flex-col">
            {selectedLog ? (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Validated Schema Payload</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyRaw(selectedLog)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    {copiedId === selectedLog.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="flex-1 p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="m-auto text-center text-slate-400 text-xs">
                Select a telemetry packet from the list to inspect payload structure.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Server, Shield, Radio, Key, User, RefreshCw, Check, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import { MqttConfig } from '../types/telemetry';

interface MqttSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: MqttConfig;
  defaultConfig: MqttConfig;
  onSave: (newConfig: MqttConfig) => void;
}

export function MqttSettingsModal({
  isOpen,
  onClose,
  currentConfig,
  defaultConfig,
  onSave,
}: MqttSettingsModalProps) {
  const [brokerUrl, setBrokerUrl] = useState(currentConfig.brokerUrl);
  const [topic, setTopic] = useState(currentConfig.topic);
  const [clientId, setClientId] = useState(currentConfig.clientId);
  const [username, setUsername] = useState(currentConfig.username || '');
  const [password, setPassword] = useState(currentConfig.password || '');
  const [useSsl, setUseSsl] = useState(currentConfig.useSsl);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateClientId = () => {
    const randomHex = Math.random().toString(16).substring(2, 8);
    setClientId(`web_tracker_${randomHex}`);
  };



  const handleResetDefault = () => {
    setBrokerUrl(defaultConfig.brokerUrl);
    setTopic(defaultConfig.topic);
    setClientId(defaultConfig.clientId);
    setUsername(defaultConfig.username || '');
    setPassword(defaultConfig.password || '');
    setUseSsl(defaultConfig.useSsl);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = brokerUrl.trim();
    const cleanTopic = topic.trim();

    if (!cleanUrl) {
      setErrorMsg('Alamat Broker WebSocket tidak boleh kosong!');
      return;
    }

    if (!cleanUrl.startsWith('ws://') && !cleanUrl.startsWith('wss://')) {
      setErrorMsg('URL Broker harus dimulai dengan wss:// atau ws://');
      return;
    }

    if (!cleanTopic) {
      setErrorMsg('Topik MQTT tidak boleh kosong!');
      return;
    }

    const newConfig: MqttConfig = {
      brokerUrl: cleanUrl,
      topic: cleanTopic,
      clientId: clientId.trim() || `web_tracker_${Math.random().toString(16).substring(2, 8)}`,
      username: username.trim() || undefined,
      password: password || undefined,
      useSsl: cleanUrl.startsWith('wss://') || useSsl,
    };

    onSave(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Pengaturan Broker MQTT
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan dashboard website ke server EMQX broker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">


          {/* Info Notice about WebSockets & Ports */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <p className="font-semibold">Catatan Port Browser Web vs ESP32:</p>
              <p className="leading-relaxed text-blue-700 dark:text-blue-300/90">
                Dashboard web menggunakan protokol <strong>WebSocket Secure (WSS)</strong> pada port <strong>8084</strong> (bukan port 8883 yang khusus untuk koneksi hardware TCP ESP32).
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Broker URL */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              <span>Alamat Broker WebSocket (WSS / WS)</span>
            </label>
            <input
              type="text"
              value={brokerUrl}
              onChange={(e) => {
                setBrokerUrl(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="wss://pa16de91.ala.asia-southeast1.emqxsl.com:8084/mqtt"
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Format: <code className="text-blue-600 dark:text-blue-400">wss://host:8084/mqtt</code> atau <code className="text-blue-600 dark:text-blue-400">ws://host:8083/mqtt</code>
            </p>
          </div>

          {/* 2. Topic */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>Topik MQTT Telemetri</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="tracker/device01/telemetry"
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Topik yang sama dengan yang dikirimkan oleh ESP32 (misal: <code>tracker/device01/telemetry</code> atau <code>telemetry/#</code>)
            </p>
          </div>

          {/* 3. Client ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Client ID Dashboard</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateClientId}
                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Ulang</span>
              </button>
            </div>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 4. Credentials: Username & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Username (Opsional)</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: WEB"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Password (Opsional)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password akun broker"
                  className="w-full px-3 py-2 pr-9 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset ke Bawaan
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Hubungkan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

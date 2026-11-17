import { MqttConfig } from '../types/telemetry';

// ============================================================================
// TEMPAT ANDA MENGISI KONFIGURASI MQTT BROKER EMQX
// ============================================================================
// File ini khusus untuk mengatur alamat server, port, topik, dan akun EMQX Anda.
// Cukup ubah teks di dalam tanda kutip sesuai kebutuhan Anda.
// ============================================================================

export const MQTT_CONFIG: MqttConfig = {
  // 1. Alamat Server Broker EMQX WebSocket
  // - Default publik gratis: "wss://broker.emqx.io:8084/mqtt"
  // - Jika punya EMQX Cloud sendiri: "wss://NAMA_CLUSTER_ANDA.emqx.cloud:8084/mqtt"
  brokerUrl: 'wss://pa16de91.ala.asia-southeast1.emqxsl.com:8084/mqtt',

  // 2. Saluran Topik Telemetri
  // - "telemetry/#" : Menerima data dari SEMUA perangkat tracker
  // - "telemetry/tracker" : Menerima data khusus dari topik ini
  topic: 'tracker/device01/telemetry',

  // 3. Nama Client ID Dashboard di broker
  clientId: `GPS_TRACKER_01${Math.random().toString(16).substring(2, 8)}`,

  // 4. Penggunaan SSL (Wajib true jika menggunakan wss://)
  useSsl: true,

  // 5. Akun Login Broker (Opsional: kosongkan jika menggunakan broker publik)
  username: "WEB", // Contoh jika ada: "my_username"
  password: "12345678", // Contoh jika ada: "my_password"
};

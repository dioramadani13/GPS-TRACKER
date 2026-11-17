# Product Requirements Document (PRD)
## IoT Monitoring Dashboard – GPS Tracker

| Item | Details |
| :--- | :--- |
| **Document Version** | 1.0.0 |
| **Status** | Approved for Development (MVP) |
| **Author** | Senior Product Manager & System Analyst |
| **Target Audience** | Frontend Developer, Backend/Embedded Systems Engineer, QA |
| **Core Principle** | *Simple Interface, Real-Time Monitoring, Clear Information* |

---

## 1. Product Overview

 Sensus dan pemantauan posisi aset secara jarak jauh (*real-time*) merupakan kebutuhan krusial pada aplikasi pelacakan kendaraan dan perangkat IoT seluler. Produk ini adalah **IoT Monitoring Dashboard – GPS Tracker**, sebuah aplikasi web berbasis *Single Page Application* (SPA) yang dirancang khusus untuk memantau lokasi geografis, kecepatan aktual, dan status baterai dari perangkat pelacak keras (*hardware tracker*) secara *real-time*.

Sistem perangkat keras eksternal terdiri dari:
* **Microcontroller:** ESP32 DOIT DevKit V1
* **GPS Module:** u-blox NEO-6M
* **Power Source:** Baterai Lithium-ion 18650 ($3.7\text{ V} - 4.2\text{ V}$)
* **Battery Sensing Circuit:** Rangkaian pembagi tegangan (*Voltage Divider*) dengan resistor $R_1 = 100\text{ k}\Omega$ dan $R_2 = 100\text{ k}\Omega$ yang terhubung ke ADC ESP32 GPIO34.
* **Protocol & Network:** Wi-Fi ke Cloud MQTT Broker.

Website dashboard ini akan mendengarkan (*subscribe*) data telemetry yang dikirimkan oleh ESP32 via MQTT/WebSocket, lalu merender pembaruan visual secara otomatis tanpa perlu *refresh* halaman.

---

## 2. Background and Problem Statement

### 2.1 Background
Penggunaan GPS Tracker pada skala proyek akademik maupun prototipe industri kecil sering kali terkendala oleh antarmuka visual (*dashboard*) yang terlalu rumit, mahal, atau sarat akan *features bloat* (banyak fitur yang tidak relevan). Pengguna membutuhkan cara tercepat dan teringan untuk mengetahui lokasi fisik dan kondisi daya perangkat secara instan.

### 2.2 Problem Statement
1. **Lack of Instant Visibility:** Pengguna kesulitan memantau pergerakan fisik perangkat secara *live* tanpa keterlambatan data (*latency*) yang signifikan.
2. **Cluttered Interfaces:** Kebanyakan dashboard IoT umum (seperti ThingSpeak atau Adafruit IO bawaan) menyajikan data dalam bentuk grafik garis generik yang kurang intuitif untuk data spasial/GPS.
3. **Power Unawareness:** Tanpa pemantauan persentase dan tegangan baterai yang akurat, perangkat berisiko mati di lapangan tanpa peringatan awal.

---

## 3. Product Objectives

1. Menyajikan posisi geografis perangkat pelacak pada peta interaktif berbasis OpenStreetMap dengan pembaruan otomatis ($< 1\text{ s}$ setelah data diterima di *frontend*).
2. Tampil secara responsif dan seragam baik pada perangkat *desktop* maupun *smartphone* menggunakan arsitektur *Single Page Dashboard*.
3. Menampilkan indikator telemetri utama: Kecepatan aktual ($\text{km/h}$), Persentase Baterai ($\%$), Tegangan Baterai ($\text{V}$), serta Status Koneksi (Online/Offline).
4. Menyediakan penanganan kesalahan (*error handling*) visual yang jelas saat sinyal GPS hilang (*No Satellite Fix*) atau koneksi terputus.

---

## 4. Target Users

| Target User | Description | Primary Needs |
| :--- | :--- | :--- |
| **Operator / Proyek Supervisor** | Individu yang bertugas memantau pergerakan perangkat IoT di lapangan secara berkala. | Tampilan peta yang luas, pembaruan posisi otomatis, status koneksi yang mudah dibaca. |
| **Pengembang Hardware / Mahasiswa** | Pengembang yang menguji performa modul ESP32 & NEO-6M di lapangan. | Verifikasi data telemetry (koordinat, tegangan baterai, latency) secara *real-time*. |

---

## 5. Product Scope

### 5.1 In-Scope (MVP Versi 1.0)
* Single-page web dashboard tanpa navigasi halaman tambahan.
* Peta interaktif (OpenStreetMap via Leaflet.js) dengan kustom marker GPS dan pergerakan *real-time*.
* Fitur *recenter map*, *zoom in/out*, dan popup info marker.
* Widget pemantauan kecepatan aktual ($\text{km/h}$).
* Widget pemantauan baterai (Persentase $\%$, Tegangan $\text{V}$, dan *color indicator*).
* Header status koneksi (*Online/Offline*) dan waktu pembaruan terakhir (*Last Update*).
* Integrasi komunikasi data MQTT via WebSocket secara langsung atau melalui backend bridge sederhana.

### 5.2 Out-of-Scope (Excluded from MVP)
* Manajemen pengguna (*Multi-tenant Authentication/Role-based access*).
* Histori perjalanan (*Route Playback*) dan pencatatan riwayat koordinat lama.
* Geofencing dan notifikasi push/email/SMS.
* Pengaturan parameter hardware jarak jauh (*Remote Command / Downlink MQTT*).
* Fitur E-commerce atau analitik prediktif.

---

## 6. Functional Requirements

### FR-001: Interactive GPS Map
* **Description:** Menampilkan posisi fisik perangkat pada peta digital berbasis ubin (*tile map*).
* **Expected Behavior:** Peta memuat OpenStreetMap dengan marker aktif pada koordinat `latitude` dan `longitude` terbaru.
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Peta berhasil dirender menggunakan library Leaflet.js.
  * Marker otomatis berpindah ke koordinat baru tanpa *reload* halaman saat JSON MQTT masuk.
  * Klik pada marker membuka Popup yang menampilkan info Latitude, Longitude, dan Timestamp data.

### FR-002: Map Controls & Recenter
* **Description:** Kontrol peta untuk navigasi pengguna.
* **Expected Behavior:** Menyediakan tombol Zoom In, Zoom Out, dan tombol "Recenter" untuk memfokuskan kembali tampilan peta ke titik marker saat ini.
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Tombol Recenter secara otomatis mengubah *center point* peta ke koordinat terbaru perangkat dengan animasi *pan/flyTo*.

### FR-003: Real-Time Speed Monitoring
* **Description:** Komponen widget visual untuk menampilkan kecepatan pergerakan perangkat.
* **Expected Behavior:** Menampilkan nilai numerik kecepatan dari sensor NEO-6M dalam satuan $\text{km/h}$.
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Nilai kecepatan terupdate secara instan mengikuti *field* `speed` dari payload JSON.
  * Menampilkan nilai $0.0\text{ km/h}$ jika perangkat berhenti atau jika nilai `speed` $< 0.5\text{ km/h}$ (mengabaikan *GPS drift*).

### FR-004: Battery SoC Percentage & Visual Indicator
* **Description:** Menampilkan estimasi kapasitas baterai Li-ion 18650.
* **Expected Behavior:** Persentase baterai ($0 - 100\%$) ditampilkan bersama komponen visual *progress bar* / *battery icon* bersistem kode warna.
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Warna Hijau jika persentase $> 50\%$.
  * Warna Kuning jika persentase $20\% - 50\%$.
  * Warna Merah jika persentase $< 20\%$.

### FR-005: Battery Voltage Measurement Display
* **Description:** Menampilkan tegangan aktual baterai yang diukur melalui pembagi tegangan ESP32.
* **Expected Behavior:** Angka tegangan aktual ditampilkan dengan presisi 2 desimal ($\text{Volt}$).
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Nilai dirender sesuai data `battery_voltage` dalam JSON (contoh: $3.85\text{ V}$).

### FR-006: Device Connection Status Indicator
* **Description:** Menunjukkan apakah perangkat hardware aktif terhubung dan mengirim data.
* **Expected Behavior:** Status berubah menjadi **ONLINE** (Warna Hijau) saat data diterima, dan berubah menjadi **OFFLINE** (Warna Merah/Abu-abu) jika tidak ada data masuk melebihi batas *timeout* ($15\text{ detik}$).
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Sistem menjalankan *timer heartbeat* internal di frontend. Jika selisih `now()` dengan timestamp data terakhir $> 15\text{ detik}$, status otomatis menjadi "OFFLINE".

### FR-007: Last Update Timestamp Display
* **Description:** Menampilkan waktu terakhir kali paket data berhasil diterima oleh dashboard.
* **Expected Behavior:** Format waktu relatif atau absolut yang mudah dibaca (contoh: `12:30:05 PM` atau `2 seconds ago`).
* **Priority:** Must Have.
* **Acceptance Criteria:**
  * Timestamp diperbarui setiap kali paket payload MQTT valid masuk ke frontend.

---

## 7. Non-Functional Requirements

| ID | Category | Requirement Specification |
| :--- | :--- | :--- |
| **NFR-001** | **Performance** | Dashboard harus memproses dan merender payload MQTT di UI dalam waktu $< 200\text{ ms}$ setelah payload diterima oleh WebSocket. |
| **NFR-002** | **Responsiveness** | Tampilan antarmuka harus mendukung resolusi layar dari $320\text{px}$ (Smartphone) hingga $> 1920\text{px}$ (Desktop Monitor) tanpa *horizontal scrollbar*. |
| **NFR-003** | **Lightweight** | Total ukuran *initial bundle load* web frontend harus di bawah $1.5\text{ MB}$ untuk memastikan pemuatan cepat pada jaringan seluler 3G/4G. |
| **NFR-004** | **Reliability** | Frontend harus melakukan Reconnection Protocol secara otomatis jika koneksi WebSocket ke MQTT broker terputus (*auto-reconnect with exponential backoff*). |
| **NFR-005** | **Security** | Kredensial sensitif MQTT (Host, Port, Username, Password) tidak boleh terekspos secara *hardcoded* pada kode publik client-side. Gunakan Environment Variables atau backend proxy server. |
| **NFR-006** | **Maintainability** | Kode sumber disusun modular memisahkan komponen UI visual, logika koneksi MQTT, dan logika parsing data. |

---

## 8. User Interface and User Experience (UI/UX) Requirements

### 8.1 Layout Structure (Single Page Dashboard)

Dashboard menggunakan tata letak *Clean Dark Mode* atau *Clean Light Mode* dengan struktur grid sebagai berikut:

```
+-----------------------------------------------------------------------+
|  [Logo] IoT GPS Tracker                Status: [● ONLINE]  12:30:00   |  <- Header
+----------------------------------------------------+------------------+
|                                                    |  BATTERY CARD    |
|                                                    |  [||||||||  ] 75%|
|                                                    |  Voltage: 3.85 V |
|                                                    +------------------+
|                                                    |  SPEED CARD      |
|                 INTERACTIVE MAP                    |  12.5 km/h       |
|              (OpenStreetMap / Leaflet)             +------------------+
|                                                    |  GPS INFO CARD   |
|                                                    |  Lat: -7.952456  |
|                                                    |  Lng: 112.613245 |
|                                                    |  Alt: 450.2 m    |
|  [Recenter Map]                                    |  Sats: 8 Fix     |
+----------------------------------------------------+------------------+
```

### 8.2 Component Specifications
1. **Header Bar:**
   * Judul Aplikasi: `IoT GPS Tracker` (Bold, font sans-serif).
   * Connection Status Badge: Pilihan warna (Hijau: Online, Merah: Offline).
   * Last Update Text: Menggunakan font monospace.
2. **Main Content - Map Area (Left/Top on Mobile):**
   * Mengambil porsi $65\% - 75\%$ lebar layar pada Desktop.
   * Sudut *card* melengkung (*rounded corners* $8\text{px} - 12\text{px}$).
   * Floating button "Recenter Map" di pojok kanan bawah peta.
3. **Sidebar Cards Area (Right/Bottom on Mobile):**
   * **Battery Card:** Menampilkan persentase besar, grafik progress bar baterai, dan nilai tegangan ($\text{V}$).
   * **Speed Card:** Menampilkan angka kecepatan utama dengan ukuran font besar ($36\text{pt} - 48\text{pt}$) diikuti unit `km/h`.
   * **GPS Coordinate Card:** Menampilkan angka latitude, longitude, dan ketinggian (*altitude*).

---

## 9. System Architecture

Arsitektur end-to-end terdiri dari 3 layer utama:

```
+------------------+       Wi-Fi / HTTP/MQTT       +------------------------+
|  ESP32 Hardware  | ----------------------------> |  Cloud MQTT Broker     |
|  - NEO-6M GPS    |                               |  (EMQX / HiveMQ /      |
|  - Voltage Div.  |                               |   Mosquitto)           |
+------------------+                               +------------------------+
                                                              |
                                                    WebSocket | (Port 8083/8084)
                                                              v
                                                   +------------------------+
                                                   | Web Dashboard          |
                                                   | (Leaflet.js + Frontend)|
                                                   +------------------------+
```

### Hardware Layer Details
* **ESP32 ADC Reading:** Pembagi tegangan mereduksi tegangan baterai maks $4.2\text{ V}$ menjadi $2.1\text{ V}$ pada pin GPIO34 (aman untuk rentang ADC ESP32 $0 - 3.3\text{ V}$).
* **Perhitungan Tegangan Baterai:**
  $$V_{ADC} = V_{BAT} \times \left( \frac{R_2}{R_1 + R_2} \right)$$
  $$V_{BAT} = V_{ADC} \times \left( \frac{100\text{ k}\Omega + 100\text{ k}\Omega}{100\text{ k}\Omega} \right) = 2 \times V_{ADC}$$

---

## 10. Data Flow and MQTT Integration

1. ESP32 membaca data koordinat dari GPS NEO-6M via UART (NMEA sentence `$GPRMC` / `$GPGGA`).
2. ESP32 membaca nilai analog GPIO34, mengonversi ke tegangan baterai, dan menghitung estimasi SoC ($\%$).
3. ESP32 memformat data ke dalam string JSON dan memublikasikannya (*publish*) ke MQTT Broker pada topik: `telemetry/gps_tracker_01`.
4. Web Dashboard terhubung ke MQTT Broker melalui **WebSocket Protocol** (`ws://` atau `wss://`).
5. Web Dashboard melakukan *subscribe* ke topik `telemetry/gps_tracker_01`.
6. Ketika pesan JSON masuk, event listener di dashboard memvalidasi payload dan memperbarui State aplikasi secara reaktif.

---

## 11. Data Structure and Payload Specification

### 11.1 Topic Naming Convention
* **Telemetry Topic:** `telemetry/{device_id}` (Contoh: `telemetry/GPS_TRACKER_01`)

### 11.2 MQTT Payload Schema (JSON Format)

```json
{
  "device_id": "GPS_TRACKER_01",
  "latitude": -7.952456,
  "longitude": 112.613245,
  "speed": 12.5,
  "altitude": 450.2,
  "battery_voltage": 3.85,
  "battery_percentage": 75,
  "timestamp": "2026-11-08T12:30:00Z"
}
```

### 11.3 Field Data Types & Description

| Field Name | Data Type | Unit | Range / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `device_id` | String | - | Alphanumeric | Identifikasi unik perangkat tracker. |
| `latitude` | Float | Degree | $-90.0$ s.d $90.0$ | Koordinat Lintang GPS. |
| `longitude` | Float | Degree | $-180.0$ s.d $180.0$ | Koordinat Bujur GPS. |
| `speed` | Float | km/h | $\ge 0.0$ | Kecepatan aktual bergerak. |
| `altitude` | Float | Meter | Any float | Ketinggian di atas permukaan laut. |
| `battery_voltage`| Float | Volt | $0.0$ s.d $5.0$ | Tegangan baterai terukur. |
| `battery_percentage`| Integer | % | $0$ s.d $100$ | Estimasi sisa kapasitas baterai. |
| `timestamp` | String (ISO-8601) | UTC | Valid ISO String | Waktu pembacaan data dari hardware. |

---

## 12. Error Handling and Edge Cases

| Condition / Edge Case | Cause / Trigger | Dashboard Expected Behavior & Handling |
| :--- | :--- | :--- |
| **No Satellite Fix** | Modul NEO-6M belum mengunci satelit (indoor/terhalang). Nilai `latitude` / `longitude` bernilai `0.0` atau `null`. | Marker peta **TIDAK** dipindahkan ke lokasi $(0,0)$. Tampilkan badge peringatan visual pada UI: `"GPS Searching..."` atau `"No Fix"`. |
| **MQTT Connection Loss** | Jaringan terputus / Cloud Broker Down. | Ubah status koneksi di Header menjadi **"DISCONNECTED"** (Merah). Aktifkan mekanisme *auto-reconnect* setiap 3 detik. |
| **Device Inactive / Offline** | ESP32 kehabisan baterai / mati. Tidak ada payload masuk dalam 15 detik. | Ubah status koneksi menjadi **"OFFLINE"** (Abu-abu/Kuning). Pertahankan posisi marker terakhir di peta. |
| **Malformed JSON Payload** | Data korup saat transmisi / format tidak valid. | Tangkap error dengan `try-catch` JSON parser. Abaikan payload tersebut, cetak error di Console, dan cegah aplikasi mengalami *crash* / *blank page*. |
| **Outdated Timestamp** | Data yang dikirim memiliki waktu lalu (delay jaringan). | Bandingkan timestamp payload dengan timestamp data lokal. Abaikan jika data yang masuk lebih lama dari data yang sudah ditampilkan. |
| **Invalid Battery Reading** | Pembacaan ADC error ($V_{BAT} > 4.5\text{ V}$ atau $< 2.0\text{ V}$). | Tampilkan indikator baterai dengan ikon peringatan `"Invalid Voltage"`. |

---

## 13. Acceptance Criteria

Dokumen ini dinyatakan siap diuji dan diterima (Pass) apabila memenuhi kriteria berikut:

* [ ] **AC-1:** Dashboard berhasil memuat peta Leaflet.js dengan basemap OpenStreetMap dalam waktu $< 2\text{ detik}$.
* [ ] **AC-2:** Marker GPS pada peta berpindah posisi secara mulus sesuai nilai `latitude` & `longitude` baru dari MQTT tanpa mereload web.
* [ ] **AC-3:** Tombol "Recenter" mengembalikan tampilan pusat peta ke posisi marker saat ini.
* [ ] **AC-4:** Widget Kecepatan merender angka yang akurat dengan satuan `km/h`.
* [ ] **AC-5:** Indicator Baterai berubah warna sesuai aturan persentase ($>50\%$ Hijau, $20-50\%$ Kuning, $<20\%$ Merah).
* [ ] **AC-6:** Status Header berubah menjadi "OFFLINE" secara otomatis jika tidak ada paket data diterima selama $> 15\text{ detik}$.
* [ ] **AC-7:** Jika koordinat bernilai invalid/null, dashboard mempertahankan marker lama dan menampilkan badge `"No GPS Fix"`.
* [ ] **AC-8:** Tampilan dashboard tetap rapi dan fully functional pada ukuran layar handphone ($360\text{px}$ width).

---

## 14. Development Priority (MoSCoW Matrix)

```
+---------------------------------------+---------------------------------------+
| MUST HAVE (MVP Release)               | SHOULD HAVE (Release 1.1)             |
| - Real-time Leaflet Map & Marker      | - Custom Marker Icon (Gambar Mobil/   |
| - Speed Display Widget                |   Pin Kustom).                        |
| - Battery Voltage & SoC Display       | - Dark Mode / Light Mode Toggle.      |
| - Connection Status (Online/Offline)  | - Distance Traveled Counter (Distance |
| - MQTT via WebSocket Integration      |   Calculation in session).            |
+---------------------------------------+---------------------------------------+
| COULD HAVE (Future Development)       | WON'T HAVE (Out of Scope for now)     |
| - Historical Route Playback           | - Multi-user Login & Auth.            |
| - Export Data CSV Log                 | - Complex Administrative Settings.    |
| - Sound Alert saat Baterai Kritis     | - Geofencing Push Notification.       |
+---------------------------------------+---------------------------------------+
```

---

## 15. Technical Recommendations

Untuk memastikan pengembangan aplikasi berjalan cepat, ringan, dan cocok untuk proyek mahasiswa/prototipe:

### 15.1 Recommended Tech Stack
* **Frontend Framework:** Vanilla HTML5/JS (ES6+) atau **React.js** (via Vite) / **Tailwind CSS** untuk *styling* cepat.
* **Map Library:** **Leaflet.js** (Sangat ringan, gratis, tanpa perlu API Key seperti Google Maps).
* **MQTT Client Library:** **MQTT.js** (Dapat berjalan langsung di browser via WebSocket).
* **Backend / Middleware (Opsional):** Jika MQTT Broker tidak mendukung WebSocket secara langsung, gunakan **Node.js + Express** sederhana dengan `mqtt` dan `socket.io` sebagai WebSocket bridge.
* **Deployment Platform:** **Vercel**, **Netlify**, atau **GitHub Pages** (Gratis dan mendukung HTTPS).

### 15.2 To Be Defined (TBD) Items & Recommendations

| TBD ID | Item Description | Current Status | Technical Recommendation & Reason |
| :--- | :--- | :--- | :--- |
| **TBD-01** | **Cloud MQTT Broker Choice** | *TBD* | **Rekomendasi:** Gunakan **EMQX Cloud Free Tier** atau **HiveMQ Public Broker**. <br>*Alasan:* Mendukung native WebSockets di port `8083`/`8883` tanpa perlu setup server backend tambahan. |
| **TBD-02** | **Battery SoC Estimation Curve** | *TBD* | **Rekomendasi:** Gunakan pemetaan Linier Sederhana $3.3\text{ V} = 0\%$ dan $4.2\text{ V} = 100\%$ pada firmware ESP32, atau *Look-up Table* 10 titik pada frontend untuk kurva Li-ion 18650 yang lebih presisi. |
| **TBD-03** | **Security & Auth for MQTT** | *TBD* | **Rekomendasi:** Untuk MVP gunakan token URL unik atau `WSS` (WebSocket Secure) dengan kredensial terenkripsi pada environment file. |

---

## 16. Future Development Opportunities (Post-MVP)

1. **Historical Route Playback:** Fitur menyimpan jejak koordinat ke dalam database ringan (seperti Supabase / Firebase) untuk diputar kembali (*replay*) sesuai kurun waktu tertentu.
2. **Geofencing Virtual Boundary:** Fitur membuat lingkaran batas area pada peta, dan menampilkan notifikasi visual jika perangkat keluar dari area tersebut.
3. **Multi-Device Tracking:** Pengembangan antarmuka untuk memantau lebih dari 1 perangkat GPS Tracker sekaligus dalam satu peta dengan daftar dropdown selector.
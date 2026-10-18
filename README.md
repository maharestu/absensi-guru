# 🏫 Sistem Informasi Presensi & Agenda Mengajar Guru

Aplikasi web modern berbasis mobile-first dan desktop untuk manajemen **Absensi Kehadiran Harian** dan **Absensi Mengajar Kelas** secara real-time. Dilengkapi dengan validasi radius lokasi (Geofencing GPS), pemindaian QR Code kelas, kamera selfie terverifikasi, siklus cut-off jam sekolah, dan integrasi import data jadwal KBM dari Excel.

---

## 🌟 Fitur Utama

### 👨‍🏫 1. Portal Guru (Mobile-First Interface)
* **Presensi Kehadiran Harian:**
  * **Hadir:** Validasi radius GPS sekolah (Geofencing) dan pengambilan foto selfie langsung dari kamera perangkat.
  * **Izin / Sakit / Dinas Luar:** Pengajuan izin disertai pengunggahan dokumen/foto bukti surat keterangan.
  * **Pencegahan Duplikasi:** Membatasi presensi masuk maksimal satu kali per hari.
  * **Proteksi Akhir Pekan:** Menu presensi otomatis terkunci pada hari Sabtu dan Minggu (hari libur).
* **Presensi Mengajar Kelas:**
  * **Prasyarat Masuk:** Hanya dapat diakses jika guru telah menyelesaikan presensi masuk dengan status *Hadir*.
  * **Pemindaian QR Code Kelas:** Memindai kode QR kelas untuk memastikan guru benar-benar berada di ruang kelas terkait.
  * **Validasi Jadwal & Waktu:** Sistem mencocokkan jadwal mengajar aktif hari ini dan membatasi presensi pada rentang jam mulai s.d. selesai.
  * **Unggah Foto KBM:** Mengabadikan kegiatan belajar mengajar di kelas sebagai bukti otentik.
* **🛠️ Panel Mode Testing (Pengujian Fleksibel):**
  * Widget simulasi waktu untuk keperluan demo/QA (bisa simulasikan hari Senin–Jumat, bypass jam, dan bypass geofence GPS di luar jam kerja).

---

### 👔 2. Dashboard Kepala Sekolah (Monitoring & Laporan)
* **Real-Time Attendance Monitoring:**
  * Statistik harian: *Guru Hadir, Izin, Sakit, Dinas Luar, dan Belum Absen / Tidak Hadir*.
  * **Siklus Waktu Otomatis (Asia/Jakarta):**
    * *Sabtu & Minggu:* Nilai belum absen adalah `0` (status libur akhir pekan).
    * *Senin–Jumat Sebelum 07:00 WIB:* Nilai belum absen adalah `0` (jam sekolah belum dimulai).
    * *Senin–Jumat 07:00–15:59 WIB:* Menghitung riil guru yang belum melakukan presensi hari ini.
    * *Senin–Jumat Pukul 16:00 WIB ke Atas:* Otomatis beralih menjadi status **"Tidak Hadir" (Alpa)** untuk seluruh guru aktif yang tidak absen.
* **Deteksi Keterlambatan Presensi:** Menghitung selisih menit keterlambatan masuk terhadap batas toleransi sekolah secara otomatis.
* **Laporan Komprehensif & Ekspor:**
  * Filter rentang tanggal fleksibel (7 hari terakhir, bulan ini, atau custom range).
  * Modal detail histori kehadiran per guru beserta persentase kehadiran.
  * **Ekspor Excel:** Menghasilkan dokumen rekapitulasi kehadiran dan mengajar berformat `.xlsx` dengan styling tabel rapi.
  * **Photo Overlay Viewer:** Memeriksa foto selfie kehadiran, foto KBM kelas, atau surat bukti izin langsung di layar.

---

### ⚙️ 3. Portal Administrator (Master Data Management)
* **Kelola Data Guru:** Manajemen data NIP/NUPTK, nama, jabatan, nomor telepon, dan status aktif/nonaktif.
* **Kelola Ruang Kelas & QR Code:** Pembuatan data kelas dan generator kode QR unik yang siap dicetak untuk ditempel di pintu/dinding kelas.
* **Kelola Jadwal KBM:** Pemetaan jadwal mata pelajaran, guru pengampu, kelas, hari, dan rentang jam pelajaran.
* **Pengaturan Lokasi Sekolah:** Konfigurasi titik koordinat GPS (Latitude, Longitude) dan batas radius toleransi presensi (dalam meter).
* **Import Cerdas Excel (Multi-File PTK & Jadwal KBM):**
  * Menganalisis file Excel Profil PTK Dapodik dan Jadwal KBM sekolah secara bersamaan.
  * **Prioritas Upsert & Reaktivasi:** Memperbarui data lama, mereaktivasi guru yang kembali mengajar, serta sinkronisasi nomor telepon.
  * **NIP Sementara Otomatis:** Memberikan identitas sementara bagi guru baru/honorer yang belum tercatat di data pokok agar jadwal kelas tidak terputus.
  * **Fleksibilitas Tabel KBM:** Mampu membaca daftar guru legenda KBM di kolom samping jadwal secara dinamis.
  * **Popup Ringkasan Analisis:** Menampilkan statistik guru baru, guru diperbarui, total jadwal, dan mata pelajaran sebelum dieksekusi ke database.
* **Kelola Akun & Hak Akses:** Manajemen akun pengguna (Admin, Kepala Sekolah, Guru) beserta pengaturan ulang kata sandi.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router, React Server Components & Server Actions)
* **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL dengan custom ENUM types & Row Level Security)
* **Penyimpanan Berkas (Storage):** Supabase Storage Buckets (Foto selfie, foto KBM, surat izin)
* **Kamera & QR Scanner:** HTML5 MediaDevices API & [jsQR](https://github.com/cozmo/jsQR)
* **Geofencing:** Rumus Haversine Spherical Distance Calculation
* **Otentikasi & Sesi:** Signed Cookie HMAC-SHA256 (Web Crypto API)
* **Ekspor Dokumen:** [SheetJS (xlsx)](https://sheetjs.com/)

---

## 📁 Struktur Direktori Proyek

```text
absensi-guru/
├── actions/                  # Server Actions (Backend Logic)
│   ├── auth.ts               # Autentikasi login, logout, dan ganti password
│   ├── dashboard.ts          # Perhitungan metrik statistik dashboard kepsek & admin
│   ├── guru.ts               # Operasi CRUD master data guru
│   ├── import.ts             # Logika parser & sinkronisasi import Excel KBM & PTK
│   ├── jadwal.ts             # Operasi CRUD jadwal pelajaran KBM
│   ├── kelas.ts              # Operasi CRUD kelas dan QR Code
│   ├── laporan.ts            # Query rekonsiliasi data laporan & status alpa
│   ├── pengaturan.ts         # Pengaturan titik koordinat GPS & radius sekolah
│   ├── presensi.ts           # Submit presensi masuk, mengajar, & verifikasi QR
│   └── testing.ts            # Reset data pengujian guru harian
├── app/                      # Next.js App Router Pages
│   ├── admin/                # Halaman dashboard, master data, dan import admin
│   ├── guru/                 # Halaman mobile dashboard presensi guru
│   │   ├── pilih-status/     # Form pemilihan status kehadiran (Hadir/Izin/Sakit/Dinas)
│   │   ├── presensi/         # Alur kamera selfie & upload bukti surat
│   │   └── presensi-mengajar/# Alur pemilihan jadwal mengajar & scan QR kelas
│   ├── kepsek/               # Halaman dashboard monitoring & laporan kepala sekolah
│   ├── login/                # Halaman masuk akun
│   ├── layout.tsx            # Root layout aplikasi
│   └── page.tsx              # Landing page / redirection
├── components/               # Komponen UI Reusable
│   ├── admin/                # Komponen kelola akun, import modal, dll.
│   ├── dev/                  # Komponen DevTestingToolbar untuk simulasi waktu
│   ├── guru/                 # Header & navigasi khusus antarmuka guru
│   ├── kepsek/               # Kartu statistik, modal detail kehadiran, photo overlay
│   └── ui/                   # Tombol, input, pagination, modal, header standar
├── lib/                      # Helper & Utility Functions
│   ├── date.ts               # Konversi waktu WIB, cut-off jam, dan fase sekolah
│   ├── geo.ts                # Perhitungan jarak koordinat GPS (Haversine Formula)
│   ├── session.ts            # Enkripsi & verifikasi token sesi HMAC-SHA256
│   ├── status.ts             # Mapping warna & label status absensi
│   ├── storage.ts            # Pengunggahan & penghapusan berkas Supabase Storage
│   └── testing-mode.ts       # Konfigurasi mode pengujian client & server
├── supabase/
│   └── schema.sql            # Skema lengkap PostgreSQL, tabel, dan ENUM types
└── types/
    └── schema.ts             # Definisi TypeScript Interface & Data Types
```

---

## 🚀 Panduan Memulai di Komputer Lokal

### 1. Prasyarat Sistem
* [Node.js](https://nodejs.org/) versi 18.18 atau lebih baru.
* Proyek database aktif di [Supabase](https://supabase.com/).

### 2. Kloning & Pemasangan Dependensi
```bash
git clone https://github.com/username/absensi-guru.git
cd absensi-guru
npm install
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di direktori utama proyek, lalu isi kredensial Supabase Anda:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_kunci_anon_anda
SUPABASE_SERVICE_ROLE_KEY=sb_secret_kunci_service_role_anda

# Opsional: Secret Key untuk enkripsi sesi (default menggunakan SUPABASE_SERVICE_ROLE_KEY)
SESSION_SECRET=kunci_rahasia_acak_minimal_32_karakter
```

### 4. Menyiapkan Skema Database
1. Buka dashboard proyek Supabase Anda.
2. Masuk ke menu **SQL Editor**.
3. Buka file [`supabase/schema.sql`](file:///c:/Users/bdstd/absensi-guru/supabase/schema.sql) dari proyek ini, salin seluruh kodenya, dan jalankan (*Run*) di SQL Editor Supabase.
4. Pastikan storage bucket dengan nama `absensi` sudah dibuat di menu **Storage** Supabase (dengan visibilitas Public).

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di alamat: **`http://localhost:3000`**.

---

## 🧪 Panduan Pengujian (Testing Mode)

Aplikasi telah dilengkapi dengan fitur **Mode Testing** agar developer dapat melakukan pengujian kapan saja tanpa terhambat batasan hari libur atau jam sekolah:

1. Buka halaman guru (`/guru`).
2. Klik tombol mengambang **🛠️ Mode Testing** di pojok kanan bawah.
3. Aktifkan switch pengujian:
   * **Simulasi Hari:** Pilih hari (misal *Senin*) untuk memunculkan jadwal mengajar.
   * **Bypass Jam Mengajar:** Mengizinkan absensi kelas di luar jam pelajaran.
   * **Bypass GPS:** Mengizinkan absensi tanpa terhalang radius sekolah.
   * **Reset Absensi:** Menghapus catatan absensi hari ini jika ingin mencoba alur dari nol.
4. Klik **Terapkan & Reload**.

---

## 🌐 Panduan Deployment (Vercel)

1. Push seluruh kode ke repository **GitHub**.
2. Masuk ke [Vercel](https://vercel.com/) dan impor repository proyek.
3. Masukkan variabel environment pada pengaturan proyek Vercel:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
4. Klik **Deploy**.
5. Akses website menggunakan URL HTTPS resmi yang diberikan Vercel (HTTPS wajib agar fitur Kamera dan Geofencing GPS di HP berfungsi normal).

---

## 📄 Lisensi

Dikembangkan untuk kebutuhan digitalisasi absensi dan administrasi kegiatan belajar mengajar sekolah. Hak cipta dilindungi undang-undang.

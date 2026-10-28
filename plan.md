# KETENTUAN PENGEMBANGAN (AGENTS.md & USER RULES)
1. Jangan menimbulkan bug baru.
2. Tidak mengubah apapun kecuali yang sudah diperintahkan untuk diubah.
3. Jangan menambahkan fitur baru atau apapun selain yang sudah diperintahkan untuk diubah.
4. Selalu uji dulu kodenya.
5. Selalu membaca dan menaati dokumentasi pada file `AGENTS.md`.

---

# HIGH-LEVEL IMPLEMENTATION PLAN: FITUR ABSENSI PULANG GURU

## 1. Ringkasan & Ruang Lingkup
- **Tujuan**: Menambahkan alur **Absensi Pulang** bagi guru yang mudah dan cepat (tanpa alur kamera berbelit-belit), langsung menampilkan kartu verifikasi detail kepulangan, submit ke server, dan menampilkan halaman konfirmasi berhasil, dengan gaya visual yang selaras dan konsisten dengan fitur Absensi Kehadiran.
- **Batasan & Desain**:
  - Menu ditempatkan di Dashboard Guru (`/guru`) tepat di bawah menu "Absensi Mengajar".
  - Saat diklik, langsung membuka halaman verifikasi ringkasan kepulangan.
  - Setelah klik submit, langsung diarahkan ke halaman "Absensi Pulang Berhasil".
  - Waktu kepulangan tercatat di database dan terintegrasi otomatis ke kolom **JAM PULANG** pada laporan kehadiran dan ekspor dokumen Word (.docx) & Excel.
  - Menjaga keutuhan seluruh 170 test cases yang sudah ada tanpa menimbulkan *breaking changes*.

---

## 2. Skema Basis Data (Database Schema)
Untuk menjaga kesatuan data harian dan efisiensi query tanpa duplikasi record, data kepulangan ditambahkan langsung ke tabel `absensi_masuk`:
```sql
-- Tambahkan kolom waktu_pulang pada tabel absensi_masuk
ALTER TABLE absensi_masuk ADD COLUMN IF NOT EXISTS waktu_pulang TIMESTAMPTZ;
```
*Keuntungan Arsitektural*:
- Setiap guru memiliki tepat 1 baris kehadiran per hari (`UNIQUE (guru_id, tanggal)`).
- `waktu_submit` berfungsi sebagai jam masuk, dan `waktu_pulang` mencatat jam kepulangan pada hari yang sama.
- Mempermudah rekonsiliasi laporan dan ekspor rekapitulasi tanpa memerlukan *JOIN query* tambahan yang membebani database.

---

## 3. Alur Antarmuka Pengguna (UI/UX Flow)

### A. Dashboard Guru (`app/guru/page.tsx`)
- Menambahkan kartu menu ke-3 pada daftar menu:
  - **Judul**: *Absensi Pulang*
  - **Deskripsi**: *Catat waktu kepulangan Anda setelah jam sekolah.*
  - **Tag**: *Kepulangan harian*
  - **Warna & Aksen**: Amber / Oranye (`text-amber-600 bg-amber-50`) dengan ikon jam pulang/logout modern.
  - **Kondisi Cerdas (Smart State)**:
    - *Belum Absen Hadir*: Tombol disabled atau menampilkan tooltip pemberitahuan bahwa guru perlu presensi masuk terlebih dahulu.
    - *Sudah Absen Pulang Hari Ini*: Menampilkan badge hijau *"Sudah Absen Pulang"* beserta jam kepulangan.
    - *Siap Pulang*: Navigasi langsung ke `/guru/presensi-pulang`.

### B. Halaman Verifikasi Pulang (`app/guru/presensi-pulang/page.tsx`)
- Tampilan identik dan serasi dengan [`components/absensi/verification-card.tsx`](file:///c:/Users/bdstd/absensi-guru/components/absensi/verification-card.tsx):
  - **Header Halaman**: `PageHeader` dengan tombol panah kembali ke `/guru` dan judul *"Verifikasi Absen Pulang"*.
  - **Kartu Verifikasi (`VerificationCard`)**:
    1. `Tanggal Absensi Pulang`: Tanggal hari ini dalam format bahasa Indonesia (contoh: *"Rabu, 28 Oktober 2026"*).
    2. `Waktu Pulang`: Jam kepulangan saat ini WIB (contoh: *"16:05 WIB"*).
    3. `Nama Guru`: Nama lengkap guru bersangkutan.
    4. `NIP / NUPTK`: Nomor identitas guru.
    5. `Jam Masuk Sebelumnya`: Jam kedatangan guru hari ini (contoh: *"06:48 WIB"*).
    6. `Status`: Badge *"Absen Pulang"*.
  - **Tombol Aksi**:
    - Tombol utama: **"Kirim Absensi Pulang"** (dengan animasi loading saat proses simpan).

### C. Halaman Konfirmasi Berhasil (`app/guru/presensi-pulang/berhasil/page.tsx`)
- Mengadaptasi layout sukses dari [`app/guru/presensi/berhasil/page.tsx`](file:///c:/Users/bdstd/absensi-guru/app/guru/presensi/berhasil/page.tsx):
  - Lingkaran centang hijau melayang (`bg-[#16a34a]`).
  - Judul: **Absensi Pulang<br />Berhasil**.
  - Deskripsi: *"Data waktu kepulangan Anda hari ini sudah tersimpan."*
  - Kotak status putih rounded: Tanggal & Waktu WIB + badge hijau *"TERSIMPAN"*.
  - Tombol **"Selesai"**: Membersihkan status temporer dan kembali ke dashboard guru `/guru`.

---

## 4. Logika Server Action (`actions/presensi.ts`)
- **Fungsi `submitPresensiPulangAction()`**:
  1. Verifikasi sesi login guru (`getSession()`).
  2. Ambil tanggal hari ini berbasis WIB (`getTodayWIB()`).
  3. Cek catatan absensi masuk hari ini:
     - Jika belum ada atau statusnya bukan `hadir`, tolak dengan pesan: *"Anda belum melakukan presensi masuk (Hadir) hari ini."*
  4. Cek apakah sudah pernah absen pulang hari ini:
     - Jika `waktu_pulang` sudah terisi, tolak dengan pesan: *"Anda sudah melakukan absensi pulang hari ini."*
  5. Jalankan `UPDATE absensi_masuk SET waktu_pulang = NOW() WHERE guru_id = ... AND tanggal = ...`.
  6. Return `{ success: true, waktuPulang: "HH:mm" }`.

- **Fungsi `cekStatusAbsensiPulangHariIni(guruId, tanggal)`**:
  - Mengecek apakah guru sudah memiliki nilai `waktu_pulang` untuk tanggal tertentu agar dashboard dapat menampilkan badge selesai.

---

## 5. Integrasi Laporan & Ekspor Dokumen
1. **Query Laporan Kehadiran (`actions/laporan.ts`)**:
   - Sertakan kolom `waktu_pulang` pada select `absensi_masuk`.
   - Tambahkan properti `waktu_pulang` (format `HH:mm`) ke interface `LaporanKehadiran`.
2. **Ekspor Word DOCX (`lib/export-docx.ts`)**:
   - Tambahkan `waktu_pulang?: string` pada `DocxExportRecord`.
   - Pada baris tanggal yang memiliki `waktu_pulang`, isi kolom **JAM PULANG** dengan nilai waktu tersebut (jika belum pulang, tetap `-`).
3. **Modal Detail Kehadiran Kepsek (`components/kepsek/LaporanDetailModal.tsx`)**:
   - Kolom `JAM PULANG` pada tabel rincian harian guru otomatis menampilkan jam pulang riil.

---

## 6. Rencana Pengujian & Validasi
1. **Type Checking**:
   - Menjalankan `npx tsc --noEmit` untuk memastikan semua rute baru, props, dan server actions bebas dari error tipe TypeScript.
2. **Automated Test Runner**:
   - Menjalankan `npx tsx tests/test-runner.ts` memastikan seluruh 170 unit & integration test cases tetap 100% Pass.
3. **End-to-End Flow Verification**:
   - Menguji alur: Guru Hadir -> Menu Absen Pulang aktif -> Buka halaman verifikasi -> Klik submit -> Halaman berhasil muncul -> Dashboard menampilkan status selesai -> Laporan & Ekspor DOCX memuat JAM PULANG dengan benar.

buatkan plan dengan tulisan high level degnan ketetuan dibawah:
1. jangan menimbulkan bug baru
2. tidak mengubah apaun kecuali yang sudah di perintahkan untuk di ubah
3. jangan menambahkan fitur baru atau apapun selain yang sudah di perintahkan untuk di ubah
4. selalu uji dulu kodenya
5. kamu harus selalu membaca dokumentasi terlebih dahulu pada file agents.md



catatan tambahan:
- Pada overlay detail, diagram lingkaran persentase dan card-card statistik tetap dipertahankan.
- Tambahan fitur export per guru: tombol "Export" di samping tombol "Detail" pada tabel utama kehadiran.
- Format export per guru berupa file DOCX (.docx) yang format, layout, font, dan kop suratnya dibuat semirip mungkin dengan template: `c:\Users\bdstd\Downloads\Format Rekapitulasi Absensi Guru.docx` menggunakan logo di folder `public` (`logo-karawang.jpeg` dan `Logo.png`).

---

# HIGH-LEVEL IMPLEMENTATION PLAN

## 1. Lingkup & Batasan
- **HANYA Laporan Kehadiran**: Absensi Mengajar TIDAK diubah.
- Tidak menimbulkan bug baru, mempertahankan loading, filter, dan photo preview.
- Membaca dan menaati aturan Next.js di `AGENTS.md`.

## 2. Tabel Utama Laporan Kehadiran (`app/kepsek/laporan/page.tsx`)
- Mengubah baris tabel dari log harian menjadi agregat per Guru.
- Kolom tabel utama (9 kolom):
  1. `TANGGAL PERIODE`: Rentang tanggal aktif (misal: "01 Sep – 17 Sep 2026").
  2. `NAMA GURU`: Nama guru dengan NIP/NUPTK tepat di bawahnya.
  3. `JUMLAH HADIR`: Total hari hadir dalam periode aktif.
  4. `PERSENTASE HADIR`: Persentase kehadiran (`(Hadir / Total Hari) × 100%`).
  5. `IZIN`: Akumulasi hari izin.
  6. `SAKIT`: Akumulasi hari sakit.
  7. `DINAS LUAR`: Akumulasi hari dinas luar.
  8. `TIDAK HADIR`: Akumulasi hari tidak hadir.
  9. `AKSI`: Berisi 2 tombol untuk setiap guru:
     - Tombol `Detail`: Membuka modal overlay rincian harian guru tersebut.
     - Tombol `Export`: Mengunduh file `.docx` rekapitulasi absensi guru tersebut sesuai template resmi.

## 3. Overlay Modal Detail Kehadiran (`components/kepsek/LaporanDetailModal.tsx`)
- **Tetap Mempertahankan**:
  - Donut chart persentase kehadiran (`% Hadir`).
  - Stat cards ringkasan (`Hadir`, `Sakit`, `Izin`, `Dinas luar`, `Tidak hadir`).
- **Sub-Tabel Rincian Harian (5 Kolom)**:
  1. `TANGGAL`: Format tanggal harian.
  2. `FOTO`: Tombol kamera preview foto masuk / surat bukti jika ada (atau `—` jika tidak ada).
  3. `JAM MASUK`: Waktu absensi masuk guru (atau `—`).
  4. `JAM PULANG`: Menampilkan strip `—` (sistem belum mencatat absensi pulang).
  5. `STATUS`: Badge warna status kehadiran.

## 4. Fitur Export DOCX per Guru (`lib/export-docx.ts`)
- Format dokumen Office Open XML (.docx) sesuai referensi template `Format Rekapitulasi Absensi Guru.docx`:
  - **Kop Surat**:
    - Logo Kabupaten Karawang (`public/logo-karawang.jpeg`) di kiri.
    - Teks Kop Center: PEMERINTAH KABUPATEN KARAWANG, DINAS PENDIDIKAN DAN KEBUDAYAAN, SMP NEGERI 8 KARAWANG BARAT, Alamat & Email.
    - Logo SMPN 8 (`public/Logo.png`) di kanan.
    - Garis ganda pembatas kop surat.
  - **Judul**:
    - `DAFTAR KEHADIRAN [BULAN] TAHUN [TAHUN]`.
  - **Identitas Guru**:
    - `Nama : [NAMA GURU]`
    - `NIP  : [NIP GURU]`
  - **Tabel Rekapitulasi Harian**:
    - Kolom: `TANGGAL`, `HARI`, `JAM MASUK`, `JAM PULANG`, `KETERANGAN`.
    - Data per tanggal dalam bulan tersebut:
      - Hari kerja hadir: jam masuk, jam pulang (`-`), keterangan `Hadir`.
      - Hari kerja izin/sakit/dinas: keterangan `Izin`/`Sakit`/`Dinas Luar`.
      - Hari kerja tanpa presensi: keterangan `Tidak Hadir`.
      - Akhir pekan (Sabtu & Minggu): keterangan `Libur`.
      - tanggal merah/libur panjang juga: keterangannya 'libur'.
  - **Tanda Tangan**:
    - Sebelah kanan bawah: `Karawang, [Bulan] [Tahun]`, `Kepala Sekolah SMPN 8 Karawang Barat`, nama Kepala Sekolah (`H. Mamay Abdullah, S.Pd., M.Pd.`), NIP Kepala Sekolah (`NIP. 197007241998021003`).

## 5. Validasi & Pengujian
- Uji tipe TypeScript: `npx tsc --noEmit`
- Uji unit testing: `npm test` (memastikan 100% test suite tetap lulus)
- Uji integrasi unduhan dokumen Word (.docx) dan preview modal.
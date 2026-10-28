# KETENTUAN PENGEMBANGAN (AGENTS.md & USER RULES)
1. Jangan menimbulkan bug baru.
2. Tidak mengubah apapun kecuali yang sudah diperintahkan untuk diubah.
3. Jangan menambahkan fitur baru atau apapun selain yang sudah diperintahkan untuk diubah.
4. Selalu uji dulu kodenya.
5. Selalu membaca dan menaati dokumentasi pada file `AGENTS.md`.

---

# HIGH-LEVEL IMPLEMENTATION PLAN: PENYEMPURNAAN TAB ABSENSI MENGAJAR (PENGHAPUSAN KOLOM MAPEL & PERHITUNGAN RIIL TOTAL JADWAL)

## 1. Ringkasan & Ruang Lingkup
- **Tujuan**:
  1. Menghapus kolom `MATA PELAJARAN` dari tabel utama Tab "Mengajar" di halaman Laporan Kepala Sekolah (`app/kepsek/laporan/page.tsx`).
  2. Menghitung **Total Jadwal riil** bagi setiap guru berdasarkan akumulasi sesi KBM aktif dari master `jadwal` pada rentang hari sekolah (`startDate` s.d. `endDate`, tidak termasuk hari libur dan akhir pekan).
  3. Menampilkan kolom **`TOTAL JADWAL`** tepat di samping kiri kolom `JUMLAH MENGAJAR` pada tabel utama.
  4. Menambahkan kartu **`Total jadwal`** pada modal detail (`components/kepsek/LaporanDetailModal.tsx`) tepat di samping kiri kartu `Mengajar`, dengan nilai total jadwal riil guru tersebut di periode aktif.
- **Batasan & Desain**:
  - Perubahan ini khusus pada modul **Absensi Mengajar**.
  - Fitur ekspor tetap ditangguhkan sesuai arahan sebelumnya.
  - Mempertahankan 100% kelulusan dari 20 test suites (170 tests) dan 0 error TypeScript.

---

## 2. Rincian Teknis Perubahan

### A. Tabel Utama Tab "Mengajar" (`app/kepsek/laporan/page.tsx`)
1. **Perhitungan Total Jadwal Riil**:
   - Memuat data master jadwal aktif melalui `getJadwalList()`.
   - Menghitung seluruh kemunculan hari mengajar guru yang jatuh pada hari sekolah aktif (Senin–Jumat) di luar `hariLiburList` dan `liburPanjang`.
2. **Urutan 7 Kolom Tabel Utama (Setelah Kolom Mata Pelajaran Dihapus)**:
   1. `TANGGAL` (Rentang periode aktif)
   2. `NAMA GURU` (dengan NIP/NUPTK di bawah nama)
   3. **`TOTAL JADWAL`** (Total sesi KBM terjadwal dalam periode aktif)
   4. **`JUMLAH MENGAJAR`** (Total sesi mengajar terlaksana)
   5. **`PERSENTASE MENGAJAR`** (`(Jumlah Mengajar / Total Jadwal) * 100%`)
   6. **`TIDAK MENGAJAR`** (Total sesi jadwal tidak mengajar tercatat)
   7. **`AKSI`** (Tombol *Detail*)
3. **Proporsi Lebar Kolom Responsif**:
   - `TANGGAL`: 16%
   - `NAMA GURU`: 26%
   - `TOTAL JADWAL`: 12% (text-center)
   - `JUMLAH MENGAJAR`: 12% (text-center)
   - `PERSENTASE MENGAJAR`: 14% (text-center)
   - `TIDAK MENGAJAR`: 12% (text-center)
   - `AKSI`: 8% (text-center)
   Total: 100%.

---

### B. Modal Detail Laporan Mengajar (`components/kepsek/LaporanDetailModal.tsx`)
1. **Prop `totalJadwalGuru`**:
   - Diterima dari komponen halaman utama untuk guru yang dipilih.
2. **3 Kartu Statistik Sejajar**:
   - **Kartu 1 (Total Jadwal)**: Berada tepat di samping kiri kartu Mengajar, menampilkan angka riil seluruh jadwal guru di periode tersebut (contoh: *75 sesi periode ini*).
   - **Kartu 2 (Mengajar)**: Jumlah sesi mengajar terlaksana.
   - **Kartu 3 (Tidak mengajar)**: Jumlah sesi tidak mengajar tercatat.
3. **Harmonisasi Visual**:
   - SVG Donut Progress Circle persentase menyesuaikan rasio terhadap `totalJadwalGuru`.
   - Sub-tabel rincian 5 kolom tetap utuh.

---

## 3. Hasil Verifikasi & Pengujian
1. **Pemeriksaan Tipe TypeScript (`npx tsc --noEmit`)**: **PASS (0 error)**.
2. **Automated Test Runner (`npx tsx tests/test-runner.ts`)**: **100% PASS (20 Suites, 170 Tests Pass)**.
3. **Status Implementasi**: **SELESAI (Completed)**.

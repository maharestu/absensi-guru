# KETENTUAN PENGEMBANGAN (AGENTS.md & USER RULES)
1. Buatplan dalam bahasa hihg level
1. Jangan menimbulkan bug baru.
2. Tidak mengubah apapun kecuali yang sudah diperintahkan untuk diubah.
3. Jangan menambahkan fitur baru atau apapun selain yang sudah diperintahkan untuk diubah.
4. Selalu uji dulu kodenya.
5. Selalu membaca dan menaati dokumentasi pada file `AGENTS.md`.
6. selalu memperhatika security nya ya


---

# RENCANA PENGEMBANGAN TINGKAT TINGGI (HIGH-LEVEL PLAN)

### 1. Skema Database & Type Definition
- **Migration SQL (`supabase/migration_add_lokasi_kelas.sql`)**:
  - Menambahkan kolom `latitude NUMERIC(9,6)`, `longitude NUMERIC(9,6)`, dan `radius_meter INTEGER DEFAULT 10` pada tabel `kelas`.
- **TypeScript Interface (`types/schema.ts`)**:
  - Memperbarui interface `Kelas` dengan atribut opsional `latitude`, `longitude`, dan `radius_meter`.
- **Schema Reference (`supabase/schema.sql`)**:
  - Memperbarui definisi tabel `kelas` untuk konsistensi dokumentasi.

### 2. Backend & Server Actions (Keamanan & Validasi)
- **Server Action Kelas (`actions/kelas.ts`)**:
  - Menambahkan fungsi `updateLokasiKelas(kelasId, { latitude, longitude, radius_meter })`.
  - **Keamanan**: Memastikan `requireAdmin()` diterapkan agar hanya admin yang dapat mengubah lokasi kelas.
  - **Validasi Data**: Validasi latitude (-90 s/d 90), longitude (-180 s/d 180), dan radius (positif, default 10m).
- **Geofencing Presensi Mengajar (`actions/presensi.ts`)**:
  - Memperbarui `verifyQrKelas` dan `validasiQrMengajar`.
  - Mengambil data koordinat dan radius dari kelas terkait saat guru memindai QR code.
  - Jika kelas memiliki titik koordinat: hitung jarak guru dengan posisi kelas menggunakan rumus Haversine (`isWithinGeofence`) dengan batas `radius_meter` kelas (default 5m).
  - Jika posisi guru di luar radius kelas: tolak presensi dengan pesan informatif.
  - Jika kelas belum diatur koordinatnya: fallback ke geofence sekolah agar KBM tetap dapat berjalan tanpa terhambat.

### 3. Antarmuka Admin (UI/UX di `components/admin/ClassManagerClient.tsx`)
- **Tombol Lokasi per Baris Kelas**:
  - Tambahkan tombol "Lokasi" (ikon MapPin) pada setiap baris kelas di tabel desktop maupun kartu mobile.
  - Indikator ringkas penanda apakah koordinat kelas sudah diset atau belum.
- **Modal Form Lokasi Kelas**:
  - Modal interaktif yang menampilkan nama kelas yang dipilih.
  - Field input: `Latitude`, `Longitude`, dan `Radius Toleransi (meter)` (default 10).
  - Tombol bantuan "Deteksi Koordinat Saya" (menggunakan GPS browser untuk kenyamanan admin saat input di lokasi).
  - Tombol "Simpan Lokasi" dengan indikator loading.
  - Tampilan pesan sukses atau notifikasi error yang jelas setelah proses simpan.

### 4. Pengujian & Verifikasi (Quality Assurance)
- Verifikasi input form dan penyimpanan koordinat ke database Supabase.
- Pengujian hak akses (security boundary): memastikan akun non-admin ditolak saat mencoba mengubah lokasi.
- Pengujian geofencing KBM guru:
  - Posisi di dalam radius (<= 10 meter) -> presensi berhasil.
  - Posisi di luar radius (> 10 meter) -> presensi ditolak dengan pesan yang sesuai.
- Uji regresi fitur kelas lainnya (edit nama kelas, cetak QR, tambah/hapus kelas).
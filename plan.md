# KETENTUAN PENGEMBANGAN (AGENTS.md & USER RULES)
1. Jangan menimbulkan bug baru.
2. Tidak mengubah apapun kecuali yang sudah diperintahkan untuk diubah.
3. Jangan menambahkan fitur baru atau apapun selain yang sudah diperintahkan untuk diubah.
4. Selalu uji dulu kodenya.
5. Selalu membaca dan menaati dokumentasi pada file `AGENTS.md`.
6. selalu memperhatika security nya ya

---

# HIGH-LEVEL IMPLEMENTATION PLAN: REVISI FITUR ABSENSI PULANG (DENGAN FOTO SELFIE)

## 1. Ringkasan & Latar Belakang

Saat ini, **Absensi Pulang** hanya mencatat `waktu_pulang` (timestamp) ke tabel `absensi_masuk`. Tidak ada foto yang diambil.

**Perubahan yang diminta:** Alur absensi pulang direvisi agar guru **wajib mengambil foto selfie** sebelum absensi pulang tercatat — mirip alur absensi masuk "Hadir". Foto disimpan ke Supabase Storage dan URL-nya dicatat di database.

---

## 2. Rincian Perubahan

### A. Database — Tabel `absensi_masuk` (TAMBAH KOLOM)

Tidak perlu tabel baru. Cukup tambah satu kolom baru:

```sql
ALTER TABLE absensi_masuk ADD COLUMN foto_pulang text;
```

Kolom `foto_pulang` (`text`, nullable) menyimpan public URL foto selfie pulang, sejajar dengan `foto_absensi` (foto masuk hadir).

---

### B. Storage — `lib/storage.ts` (TAMBAH TIPE)

Tambah `"pulang"` ke tipe `KategoriAbsensi`:

```ts
// Sebelum:
export type KategoriAbsensi = "hadir" | "sakit" | "izin" | "dinas" | "mengajar";
// Sesudah:
export type KategoriAbsensi = "hadir" | "sakit" | "izin" | "dinas" | "mengajar" | "pulang";
```

Foto pulang disimpan di path: `harian/pulang/{guruId}/{tanggal}_{timestamp}.webp`
(mengikuti pola folder yang sudah ada, tidak perlu ubah logika `uploadFotoAbsensi`).

---

### C. Backend — `actions/pengaturan.ts` (TIDAK BERUBAH)

Fungsi `verifikasiLokasiSekolah` dan `getLokasiSekolah` sudah tersedia dan cukup dipakai ulang di server action absensi pulang. Tidak perlu menambahkan fungsi baru.

---

### D. Backend — `actions/presensi.ts` (MODIFIKASI)

Fungsi `submitPresensiPulangAction` diubah agar:
1. Menerima `FormData` dengan field `file` (foto selfie WebP) dan field `latitude` + `longitude` (koordinat GPS dari client).
2. Validasi geofencing di sisi server menggunakan `isWithinGeofence` + `getLokasiSekolah` (logika yang sama persis dengan absensi masuk hadir). Jika di luar area → tolak.
3. Upload foto ke Storage dengan kategori `"pulang"`.
4. `UPDATE absensi_masuk SET waktu_pulang = ..., foto_pulang = <url>`.
5. Rollback: jika update DB gagal setelah upload → hapus foto dari storage.

Perubahan signature:
```ts
// Sebelum:
submitPresensiPulangAction()
// Sesudah:
submitPresensiPulangAction(formData: FormData)  // formData berisi: file, latitude, longitude
```

> Bypass GPS testing mode (`testConfig.bypassGps`) tetap berlaku, mengikuti pola yang sudah ada di `submitPresensiMasukAction`.

---

### E. Frontend — Alur 3 Langkah (Mirip Absensi Hadir)

#### Langkah 1 — Kamera (`app/guru/presensi-pulang/page.tsx`, DIUBAH)

Saat ini halaman langsung menampilkan kartu verifikasi + tombol submit.

Perubahannya: jika prasyarat terpenuhi (`canPulang = true`), tampilkan **`CameraCapture`** (reuse dari absensi hadir, tidak buat baru). Setelah guru ambil foto:
- Simpan foto ke `sessionStorage` (key: `"pulang_captured_photo"`, `"pulang_photo_status"`).
- Tampilkan preview + tombol "Lanjutkan" → navigasi ke `/guru/presensi-pulang/lokasi`.
- Tombol "Ulangi" → reset kamera.

Logika cek prasyarat (belum hadir, status non-hadir, sudah pulang) **tidak berubah**, tetap di halaman yang sama.

#### Langkah 2 — Cek Lokasi GPS (`app/guru/presensi-pulang/lokasi/page.tsx`, DIBUAT BARU)

Mirip halaman `app/guru/presensi/hadir/lokasi/page.tsx` (reuse struktur yang sama). Isinya:
- Tombol "Scan Lokasi" → memanggil `navigator.geolocation.getCurrentPosition()`.
- Validasi lokasi via `verifikasiLokasiSekolah(lat, lng)` (server action yang sudah ada).
- Jika valid → simpan koordinat ke `sessionStorage` (`"pulang_lat"`, `"pulang_lng"`) → navigasi ke `/guru/presensi-pulang/verifikasi`.
- Jika gagal → tampilkan pesan error + tombol "Pindai Ulang".
- Bypass GPS aktif di dev testing mode (mengikuti pola yang ada).

#### Langkah 3 — Verifikasi & Submit (`app/guru/presensi-pulang/verifikasi/page.tsx`, DIBUAT BARU)

Mirip struktur halaman verifikasi absensi masuk. Isinya:
- Preview foto yang diambil.
- Kartu **`VerificationCard`** (reuse, tidak buat baru) berisi: tanggal, waktu pulang, nama guru, NIP, jam masuk hari ini, status.
- Tombol "Kirim Absensi Pulang" → ambil foto + koordinat dari sessionStorage → konversi ke `FormData` → submit ke `submitPresensiPulangAction(formData)`.
- Berhasil → redirect ke `/guru/presensi-pulang/berhasil` (sudah ada, tidak diubah).

---

### F. Alur Navigasi Baru

```
/guru/presensi-pulang              ← Langkah 1: Kamera selfie
         ↓ klik Lanjutkan
/guru/presensi-pulang/lokasi       ← Langkah 2: Scan GPS [BARU]
         ↓ lokasi valid
/guru/presensi-pulang/verifikasi   ← Langkah 3: Review & submit [BARU]
         ↓ berhasil
/guru/presensi-pulang/berhasil     ← Sukses (tidak diubah)
```

---

## 3. Komponen & Fungsi yang Dipakai Ulang (Tidak Dibuat Baru)

| Komponen / Fungsi | Lokasi | Dipakai Untuk |
|---|---|---|
| `CameraCapture` | `components/absensi/camera-capture.tsx` | Kamera selfie langkah 1 |
| `VerificationCard` | `components/absensi/verification-card.tsx` | Kartu data langkah 3 |
| `PageHeader` | `components/ui/page-header.tsx` | Header semua halaman |
| `Button` | `components/ui/button.tsx` | Semua tombol aksi |
| `LiburPauseScreen` | `components/absensi/libur-pause-screen.tsx` | Tampilan hari libur |
| `verifikasiLokasiSekolah` | `actions/pengaturan.ts` | Validasi geofencing langkah 2 |
| `isWithinGeofence` | `lib/geo.ts` | Kalkulasi jarak geofencing (di server) |

---

## 4. File yang Diubah / Dibuat

| File | Status |
|---|---|
| Supabase — tabel `absensi_masuk` | **MIGRATION** — tambah kolom `foto_pulang text` |
| `lib/storage.ts` | **DIUBAH** — tambah tipe `"pulang"` |
| `types/schema.ts` | **DIUBAH** — tambah field `foto_pulang` ke `AbsensiMasuk` |
| `actions/presensi.ts` | **DIUBAH** — `submitPresensiPulangAction` terima FormData + validasi GPS + upload foto |
| `app/guru/presensi-pulang/page.tsx` | **DIUBAH** — tampilkan kamera jika `canPulang=true` |
| `app/guru/presensi-pulang/lokasi/page.tsx` | **DIBUAT BARU** — scan & validasi GPS |
| `app/guru/presensi-pulang/verifikasi/page.tsx` | **DIBUAT BARU** — review foto + submit |

---

## 5. Yang TIDAK Berubah

- `/guru/presensi-pulang/berhasil/page.tsx` — tidak diubah.
- Semua halaman kepala sekolah, admin, laporan — tidak diubah.
- `tests/test-runner.ts` — tetap harus 100% PASS (170 tests).

---

## 6. Urutan Implementasi

1. Jalankan SQL Migration di Supabase (tambah kolom `foto_pulang`).
2. Update `lib/storage.ts` (tambah tipe `"pulang"`).
3. Update `types/schema.ts` (tambah `foto_pulang` ke `AbsensiMasuk`).
4. Update `actions/presensi.ts` (revisi `submitPresensiPulangAction`: terima FormData, validasi GPS, upload foto).
5. Refactor `app/guru/presensi-pulang/page.tsx` (tampilkan kamera jika `canPulang=true`).
6. Buat `app/guru/presensi-pulang/lokasi/page.tsx` (scan & validasi geofencing GPS).
7. Buat `app/guru/presensi-pulang/verifikasi/page.tsx` (review foto + submit).
8. Verifikasi: `npx tsc --noEmit` (0 error) + `npm test` (100% PASS).

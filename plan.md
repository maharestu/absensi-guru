# KETENTUAN PENGEMBANGAN (AGENTS.md & USER RULES)
1. Jangan menimbulkan bug baru.
2. Tidak mengubah apapun kecuali yang sudah diperintahkan untuk diubah.
3. Jangan menambahkan fitur baru atau apapun selain yang sudah diperintahkan untuk diubah.
4. Selalu uji dulu kodenya.
5. Selalu membaca dan menaati dokumentasi pada file `AGENTS.md`.

---

# HIGH-LEVEL PLAN: PERBAIKAN INTEGRASI JAM MASUK PADA FITUR EKSPOR DOCX

## 1. Lingkup & Batasan
- **Tujuan Utama**: Memperbaiki pemetaan data kehadiran guru agar waktu kedatangan/jam masuk riil (contoh: `06:45`) tercetak dengan benar pada kolom **JAM MASUK** di berkas rekapitulasi kehadiran DOCX.
- **Status Jam Pulang**: Sesuai arahan pengguna, **JAM PULANG tetap bernilai strip (`-`)** untuk saat ini karena fitur absensi pulang belum diimplementasikan di sistem.
- **Batasan Ketat**:
  - Tidak merusak fungsionalitas laporan yang sudah berjalan (Donut chart, filter, photo overlay, dan modal detail tetap utuh).
  - Menjaga kompatibilitas mundur (*backward compatibility*): `recordMap` dapat menerima format ISO `YYYY-MM-DD` maupun format tanggal lokal.
  - Tidak menyentuh modul di luar alur ekspor kehadiran guru.

## 2. Analisis Akar Masalah (Root Cause)
- Pada [`actions/laporan.ts`](file:///c:/Users/bdstd/absensi-guru/actions/laporan.ts), data rekonsiliasi kehadiran menyimpan tanggal ISO `YYYY-MM-DD` di properti `raw_tanggal`, sedangkan properti `tanggal` diformat menjadi teks bahasa Indonesia (contoh: `"28 Okt 2026"`).
- Pada [`lib/export-docx.ts`](file:///c:/Users/bdstd/absensi-guru/lib/export-docx.ts), pembuatan baris tanggal berjalan dengan format ISO `YYYY-MM-DD` (`dateStr`), tetapi `recordMap` hanya mengindeks record berdasarkan `r.tanggal` (format teks).
- Akibatnya, pemanggilan `recordMap.get(dateStr)` selalu menghasilkan `undefined`, sehingga sistem menganggap guru tidak memiliki record jam masuk dan memberikan nilai *fallback* strip (`-`).

## 3. Rincian Teknis Implementasi
### A. Modul Generator DOCX ([`lib/export-docx.ts`](file:///c:/Users/bdstd/absensi-guru/lib/export-docx.ts))
1. **Pembaruan Interface `DocxExportRecord`**:
   - Menambahkan field opsional `raw_tanggal?: string` agar modul menerima tanggal format standar `YYYY-MM-DD`.
2. **Indeksasi `recordMap` Multi-Format**:
   - Pada saat iterasi `records.forEach`, simpan record ke dalam `recordMap` menggunakan `r.raw_tanggal` dan `r.tanggal`.
   - Hal ini memastikan pencarian `recordMap.get(dateStr)` selalu menemukan data kehadiran guru secara akurat.
3. **Ekstraksi Jam Masuk yang Bersih**:
   - Saat status guru `Hadir`, ambil `rec.waktu_masuk` jika ada dan bukan strip `"—"`, jika kosong baru gunakan `"-"`.
   - Jam pulang tetap konsisten bernilai `"-"`.

### B. Halaman Laporan Kepsek ([`app/kepsek/laporan/page.tsx`](file:///c:/Users/bdstd/absensi-guru/app/kepsek/laporan/page.tsx))
1. Pada fungsi `handleExportDocxPerGuru`, petakan data `teacherRecords` dari `laporanKehadiran` secara eksplisit:
   - `tanggal: r.raw_tanggal || r.tanggal`
   - `raw_tanggal: r.raw_tanggal`
   - `waktu_masuk: r.waktu_masuk`
   - `status: r.status`

## 4. Rencana Pengujian & Validasi
1. **Type Checking TypeScript**:
   - Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe pada `DocxExportRecord` dan `page.tsx`.
2. **Automated Test Suite Runner**:
   - Jalankan `npx tsx tests/test-runner.ts` untuk memastikan 170 unit & integration test cases (20 test suite) tetap **100% Pass**.
3. **Smoke Test Ekspor DOCX Berbasis Data Riil**:
   - Jalankan skrip uji dengan data absensi contoh (memiliki `raw_tanggal: "2026-10-01"`, `waktu_masuk: "06:48"`).
   - Validasi bahwa buffer file Word (.docx) terbuat sempurna dan data teks baris tanggal 1 Oktober memuat Jam Masuk `"06:48"` dan Jam Pulang `"-"`.

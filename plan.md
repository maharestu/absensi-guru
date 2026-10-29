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
### Optimasi Tata Letak & Spasi Ekspor Dokumen DOCX Laporan Kepsek agar Muat 1 Halaman

1. **Optimasi Margin Halaman (Page Margins)**
   - Menyesuaikan margin dokumen A4 pada `lib/export-docx.ts`:
     - Margin atas (*top*) & bawah (*bottom*): dari `1296 dxa` (~0.9 inci) menjadi `720 dxa` (~0.5 inci).
     - Margin kiri (*left*) & kanan (*right*): disesuaikan menjadi `1080 dxa` (~0.75 inci) untuk mempertahankan proporsi dokumen resmi.

2. **Perapian Jarak Spasi Antar-Baris (Line Spacing & Paragraph Spacing)**
   - Menambahkan pengaturan eksplisit `spacing: { before: 0, after: 0, line: 200 }` pada seluruh paragraf dalam sel tabel (`createHeaderCell` & `createDataCell`) agar teks tidak renggang ke atas-bawah.
   - Mengurangi *padding* sel tabel vertikal (*top/bottom margin*) dari `40 dxa` menjadi `20 dxa`.
   - Mengurangi tinggi minimum baris (*row height*) data dari `250 dxa` menjadi `210 dxa`, dan header dari `340 dxa` menjadi `260 dxa`.

3. **Kompensasi Jarak Elemen Kop Surat & Identitas Guru**
   - Merampingkan spasi antar-baris pada Kop Surat (`spacing.after`).
   - Merampingkan jarak pembatas kop (`kopDivider`) dari `200 dxa` menjadi `120 dxa`.
   - Merampingkan jarak judul periode (`judulParagraph`) dari `before: 120, after: 200` menjadi `before: 60, after: 120`.
   - Merampingkan jarak identitas guru (`identitasGuruNama` & `identitasGuruNip`).

4. **Penyesuaian Blok Tanda Tangan Kepala Sekolah**
   - Merampingkan jarak sebelum tanda tangan dari `before: 240` menjadi `before: 120`.
   - Menyesuaikan area tanda tangan (`ttdJabatan` spacing after) dari `700 dxa` (~35pt) menjadi `480 dxa` (~24pt), tetap proporsional dan cukup untuk pembubuhan tanda tangan & stempel sekolah tanpa meluap ke halaman kedua.

5. **Pengujian & Verifikasi (Quality Assurance)**
   - Menguji generasi file `.docx` dengan rentang tanggal 1 bulan penuh (31 hari).
   - Memastikan seluruh konten (Kop Surat, Judul, Identitas Guru, 31 baris absensi, dan Tanda Tangan Kepala Sekolah) berada tepat dalam 1 halaman A4.
   - Menjalankan uji tipe data (`npx tsc --noEmit`) dan automated test suite (`npm test`).
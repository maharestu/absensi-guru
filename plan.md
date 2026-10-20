# Rencana Perbaikan: Validasi Struktur File Excel (Pre-Analysis Validation)

Dokumen ini merinci rencana untuk menambahkan lapisan validasi sebelum data dianalisis lebih lanjut, guna mencegah error akibat salah unggah file, file tertukar, atau format file yang tidak sesuai standar.

---

## 🎯 1. Tujuan Perbaikan
Memastikan sistem memberikan umpan balik (error message) yang jelas jika user mengunggah file yang salah sebelum menampilkan modal "Ringkasan Analisis Data". Ini akan mencegah kebingungan user dan potensi error pemrosesan data di sisi server.

---

## 🏗️ 2. Strategi Validasi (High-Level)

### A. Pendeteksian "Sidik Jari" File (Signature Detection)
Sistem akan mengenali tipe file berdasarkan konten kolomnya, bukan hanya nama filenya:
- **Karakteristik File PTK:** Harus memiliki kolom kunci seperti `Nama`, `NIP/NUPTK`, dan `Jenis PTK`.
- **Karakteristik File Jadwal KBM:** Harus memiliki kolom legenda (Kode & Nama Guru) di kolom spesifik (AA/AB) serta penanda kelas (`7A`, `8A`, `9A`, dsb).

### B. Validasi Kontradiksi (Swapped File Detection)
Jika user mengunggah file Jadwal KBM di input "Data PTK" (atau sebaliknya), sistem akan mendeteksi ketidakcocokan tersebut secara otomatis dan memberikan peringatan spesifik: *"Sepertinya file Anda tertukar"*.

### C. Validasi Integritas Kolom
Memastikan kolom-kolom wajib yang diperlukan untuk mapping (seperti Kode Guru dan Nama Guru pada legenda KBM) benar-benar ada dan tidak kosong.

---

## 🛠️ 3. Alur Kerja Baru pada UI (`app/admin/import/page.tsx`)

1.  **Tahap Unggah:** User memilih dua file.
2.  **Tahap Pre-Processing (Validasi):**
    - Membaca beberapa baris awal dari kedua file.
    - Menjalankan fungsi `validateFileStructure` untuk masing-masing file.
    - Membandingkan hasil deteksi dengan input tujuan.
3.  **Penanganan Error:**
    - Jika validasi gagal, hentikan proses dan tampilkan pesan error merah di bawah area upload.
    - **JANGAN** tampilkan modal overlay jika validasi belum lolos.
4.  **Tahap Analisis:** Jika lolos, barulah sistem melanjutkan ke proses ekstraksi data dan menampilkan modal ringkasan.

---

## 📋 4. Tahapan Eksekusi

1.  **Refactor Fungsi Parsing:** Membuat fungsi pembantu untuk mendeteksi tipe file berdasarkan header.
2.  **Update `processBothFiles`:** Menambahkan logika pengecekan silang (cross-check) antara `filePtk` dan `fileKbm`.
3.  **Peningkatan Pesan Error:** Menambahkan pesan error yang lebih manusiawi (misal: *"Format file PTK tidak sesuai, pastikan kolom 'Nama' tersedia"*).
4.  **Verifikasi UI:** Memastikan pesan error muncul dengan tepat dan modal tidak muncul jika file salah.

---

**Jaminan:** Perbaikan ini hanya bersifat di sisi Client-side (UI) untuk validasi awal, sehingga tidak akan mengubah logika penyimpanan database yang sudah berjalan dengan benar.

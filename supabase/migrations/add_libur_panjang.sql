-- =====================================================
-- MIGRATION: Mode Libur Panjang (System Shutdown)
-- =====================================================
-- Ekstensi tabel pengaturan_sistem untuk mendukung mode libur panjang / shutdown absensi.
-- Ketika aktif dalam rentang tanggal_mulai s.d. tanggal_selesai:
-- 1. Guru tidak dapat melakukan absensi masuk maupun mengajar
-- 2. Rekap absensi dan laporan Kepsek dibiarkan kosong (sama seperti akhir pekan)
-- 3. Guru melihat banner informasi masa libur panjang di dashboard




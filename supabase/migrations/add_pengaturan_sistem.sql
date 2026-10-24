-- =====================================================
-- MIGRATION: Tambah tabel pengaturan_sistem & hari_libur
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor

-- Tabel: pengaturan_sistem (singleton — hanya 1 baris)
-- Menyimpan konfigurasi waktu absensi dan toleransi keterlambatan.
-- Jika tabel kosong, sistem otomatis fallback ke nilai hardcoded di lib/date.ts.
CREATE TABLE IF NOT EXISTS pengaturan_sistem (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jam_masuk        TIME NOT NULL DEFAULT '07:00',
    jam_cutoff       TIME NOT NULL DEFAULT '16:00',
    toleransi_menit  INTEGER NOT NULL DEFAULT 5,
    libur_panjang_aktif     BOOLEAN NOT NULL DEFAULT FALSE,
    libur_panjang_mulai     DATE,
    libur_panjang_selesai   DATE,
    libur_panjang_keterangan VARCHAR(255),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Seed baris awal dengan nilai default (sama persis dengan konstanta di lib/date.ts)
INSERT INTO pengaturan_sistem (jam_masuk, jam_cutoff, toleransi_menit)
SELECT '07:00', '16:00', 5
WHERE NOT EXISTS (SELECT 1 FROM pengaturan_sistem);

-- Tabel: hari_libur
-- Menyimpan daftar tanggal libur / tanggal merah khusus.
-- Guru yang tidak absen di tanggal ini TIDAK dihitung "Tidak Hadir" di laporan Kepsek.
CREATE TABLE IF NOT EXISTS hari_libur (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal     DATE NOT NULL UNIQUE,
    keterangan  VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk lookup cepat berdasarkan tanggal
CREATE INDEX IF NOT EXISTS idx_hari_libur_tanggal ON hari_libur (tanggal);

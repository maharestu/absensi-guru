-- Migration: Tambah kolom foto_pulang ke tabel absensi_masuk
-- Jalankan perintah SQL ini di Supabase SQL Editor

ALTER TABLE absensi_masuk 
ADD COLUMN IF NOT EXISTS foto_pulang TEXT;

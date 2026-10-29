-- Migration: Tambah kolom latitude, longitude, dan radius_meter ke tabel kelas
-- Jalankan perintah SQL ini di Supabase SQL Editor

ALTER TABLE kelas 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
ADD COLUMN IF NOT EXISTS radius_meter INTEGER DEFAULT 10;

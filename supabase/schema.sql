-- ==========================================
-- SUPABASE POSTGRESQL SCHEMA (Placeholder SQL)
-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE role_akun AS ENUM (
    'admin',
    'guru',
    'kepala_sekolah'
);

CREATE TYPE status_aktif AS ENUM (
    'aktif',
    'nonaktif'
);

CREATE TYPE status_absensi_masuk AS ENUM (
    'hadir',
    'izin',
    'sakit',
    'dinas',
    'tidak_hadir'
);

CREATE TYPE status_absensi_mengajar AS ENUM (
    'mengajar',
    'tidak_mengajar'
);

CREATE TYPE hari_jadwal AS ENUM (
    'senin',
    'selasa',
    'rabu',
    'kamis',
    'jumat'
);


-- =====================================================
-- TABLE: guru
-- =====================================================

CREATE TABLE guru (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR NOT NULL UNIQUE,
    nama VARCHAR NOT NULL,
    jabatan VARCHAR,
    no_telepon VARCHAR,
    status status_aktif NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- TABLE: akun
-- =====================================================

CREATE TABLE akun (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role role_akun NOT NULL,
    nama VARCHAR NOT NULL,
    status status_aktif NOT NULL DEFAULT 'aktif',
    guru_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_akun_guru
        FOREIGN KEY (guru_id)
        REFERENCES guru(id)
        ON DELETE RESTRICT
);


-- =====================================================
-- TABLE: kelas
-- =====================================================

CREATE TABLE kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas VARCHAR NOT NULL,
    kode_qr VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- TABLE: jadwal
-- =====================================================

CREATE TABLE jadwal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID NOT NULL,
    kelas_id UUID NOT NULL,
    mata_pelajaran VARCHAR NOT NULL,
    hari hari_jadwal NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    status status_aktif NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_jadwal_guru
        FOREIGN KEY (guru_id)
        REFERENCES guru(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_jadwal_kelas
        FOREIGN KEY (kelas_id)
        REFERENCES kelas(id)
        ON DELETE RESTRICT
);


-- =====================================================
-- TABLE: absensi_masuk
-- =====================================================

CREATE TABLE absensi_masuk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID NOT NULL,
    tanggal DATE NOT NULL,
    status status_absensi_masuk NOT NULL,
    foto_absensi TEXT,
    file_bukti_izin_sakit TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    waktu_submit TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_absensi_masuk_guru
        FOREIGN KEY (guru_id)
        REFERENCES guru(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_absensi_masuk_harian
        UNIQUE (guru_id, tanggal)
);


-- =====================================================
-- TABLE: absensi_mengajar
-- =====================================================

CREATE TABLE absensi_mengajar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jadwal_id UUID NOT NULL,
    tanggal DATE NOT NULL,
    status status_absensi_mengajar NOT NULL DEFAULT 'mengajar',
    foto_absensi TEXT,
    waktu_submit TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_absensi_mengajar_jadwal
        FOREIGN KEY (jadwal_id)
        REFERENCES jadwal(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_absensi_mengajar
        UNIQUE (jadwal_id, tanggal)
);


-- =====================================================
-- TABLE: pengaturan_lokasi_sekolah
-- =====================================================

CREATE TABLE pengaturan_lokasi_sekolah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    radius_meter INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- TABLE: pengaturan_sistem
-- =====================================================

CREATE TABLE pengaturan_sistem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jam_masuk TIME NOT NULL DEFAULT '07:00',
    jam_cutoff TIME NOT NULL DEFAULT '16:00',
    toleransi_menit INTEGER NOT NULL DEFAULT 5,
    libur_panjang_aktif BOOLEAN NOT NULL DEFAULT FALSE,
    libur_panjang_mulai DATE,
    libur_panjang_selesai DATE,
    libur_panjang_keterangan VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed baris awal dengan nilai default
INSERT INTO pengaturan_sistem (jam_masuk, jam_cutoff, toleransi_menit)
SELECT '07:00', '16:00', 5
WHERE NOT EXISTS (SELECT 1 FROM pengaturan_sistem);


-- =====================================================
-- TABLE: hari_libur
-- =====================================================

CREATE TABLE hari_libur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL UNIQUE,
    keterangan VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_akun_guru_id
    ON akun(guru_id);

CREATE INDEX idx_jadwal_guru_id
    ON jadwal(guru_id);

CREATE INDEX idx_jadwal_kelas_id
    ON jadwal(kelas_id);

CREATE INDEX idx_absensi_masuk_guru_id
    ON absensi_masuk(guru_id);

CREATE INDEX idx_absensi_mengajar_jadwal_id
    ON absensi_mengajar(jadwal_id);

CREATE INDEX idx_hari_libur_tanggal
    ON hari_libur(tanggal);
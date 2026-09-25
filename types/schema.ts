// ENUMS

export type RoleAkun = "admin" | "kepala_sekolah" | "guru";
export type StatusAktif = "aktif" | "nonaktif";
export type StatusAbsensiMasuk = "hadir" | "sakit" | "izin";
export type HariJadwal =
  | "senin"
  | "selasa"
  | "rabu"
  | "kamis"
  | "jumat";

// INTERFACES (Mapped from ERD)

export interface Akun {
  id: string; // uuid
  username: string;
  password_hash: string;
  role: RoleAkun;
  nama: string;
  status: StatusAktif;
  guru_id?: string | null; // referensi ke tabel guru (semua role bisa punya NIP)
  nip?: string | null;     // diisi dari tabel guru saat login berhasil
  created_at: Date | string;
}

export interface Guru {
  id: string; // uuid
  nip: string;
  nama: string;
  jabatan?: string | null;
  no_telepon?: string | null;
  alamat?: string | null;
  jenis_kelamin?: "Laki-Laki" | "Perempuan" | string | null;
  status: StatusAktif;
  created_at: Date | string;
}

export interface PengaturanLokasiSekolah {
  id: string; // uuid
  latitude: number;
  longitude: number;
  radius_meter: number;
  created_at: Date | string;
}

export interface Kelas {
  id: string; // uuid
  nama_kelas: string;
  kode_qr: string;
  created_at: Date | string;
}

export interface Jadwal {
  id: string; // uuid
  guru_id: string; // uuid
  kelas_id: string; // uuid
  mata_pelajaran: string;
  hari: HariJadwal;
  jam_mulai: string; // format HH:MM:SS
  jam_selesai: string; // format HH:MM:SS
  status: StatusAktif;
  created_at: Date | string;
}

export interface JadwalWithDetail extends Jadwal {
  guru?: {
    id: string;
    nama: string;
    nip: string;
  } | null;
  kelas?: {
    id: string;
    nama_kelas: string;
  } | null;
}

export interface AbsensiMasuk {
  id: string; // uuid
  guru_id: string; // uuid
  tanggal: string; // format YYYY-MM-DD
  status: StatusAbsensiMasuk;
  foto_absensi?: string | null; // Wajib jika Hadir
  file_bukti_izin_sakit?: string | null; // Wajib jika Sakit/Izin
  latitude?: number | null; // Lokasi validasi (jika Hadir)
  longitude?: number | null;
  waktu_submit: Date | string;
}

export interface AbsensiMengajar {
  id: string; // uuid
  jadwal_id: string; // uuid
  tanggal: string; // format YYYY-MM-DD
  foto_absensi: string;
  waktu_submit: Date | string;
}

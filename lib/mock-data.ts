import { Akun, Kelas, Jadwal } from "@/types/schema";

export const MOCK_USERS: Akun[] = [
  {
    id: "guru-1",
    username: "123", // NIP contoh
    password_hash: "123", // Dalam aplikasi nyata ini di-hash
    role: "GURU",
    nama: "Budi Santoso, S.Pd.",
    status: "AKTIF",
    guru_id: "guru-1-data-id",
    created_at: new Date().toISOString(),
  },
  {
    id: "admin-1",
    username: "admin",
    password_hash: "admin123",
    role: "ADMIN",
    nama: "Administrator Sekolah",
    status: "AKTIF",
    guru_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "kepsek-1",
    username: "kepsek",
    password_hash: "kepsek123",
    role: "KEPSEK",
    nama: "Drs. H. Ahmad Dahlan, M.Pd.",
    status: "AKTIF",
    guru_id: null,
    created_at: new Date().toISOString(),
  },
];

export const MOCK_TINGKATAN_KELAS = [
  { id: "7", label: "Kelas 7" },
  { id: "8", label: "Kelas 8" },
  { id: "9", label: "Kelas 9" },
];

export const MOCK_KELAS: Kelas[] = [
  // Kelas 7
  { id: "k-7a", nama_kelas: "Kelas 7A", kode_qr: "QR-7A", created_at: new Date().toISOString() },
  { id: "k-7b", nama_kelas: "Kelas 7B", kode_qr: "QR-7B", created_at: new Date().toISOString() },
  { id: "k-7c", nama_kelas: "Kelas 7C", kode_qr: "QR-7C", created_at: new Date().toISOString() },
  // Kelas 8
  { id: "k-8a", nama_kelas: "Kelas 8A", kode_qr: "QR-8A", created_at: new Date().toISOString() },
  { id: "k-8b", nama_kelas: "Kelas 8B", kode_qr: "QR-8B", created_at: new Date().toISOString() },
  { id: "k-8c", nama_kelas: "Kelas 8C", kode_qr: "QR-8C", created_at: new Date().toISOString() },
  // Kelas 9
  { id: "k-9a", nama_kelas: "Kelas 9A", kode_qr: "QR-9A", created_at: new Date().toISOString() },
  { id: "k-9b", nama_kelas: "Kelas 9B", kode_qr: "QR-9B", created_at: new Date().toISOString() },
  { id: "k-9c", nama_kelas: "Kelas 9C", kode_qr: "QR-9C", created_at: new Date().toISOString() },
];

export const MOCK_HARI = [
  { id: "senin", label: "Senin" },
  { id: "selasa", label: "Selasa" },
  { id: "rabu", label: "Rabu" },
  { id: "kamis", label: "Kamis" },
  { id: "jumat", label: "Jumat" },
];

export const MOCK_DEFAULT_MATPEL = [
  { id: "matpel-1", mata_pelajaran: "Ilmu Pengetahuan Alam", jam: "06:30 - 08:30" },
  { id: "matpel-2", mata_pelajaran: "Matematika", jam: "09:00 - 11:00" },
  { id: "matpel-3", mata_pelajaran: "Biologi", jam: "11:00 - 13:00" },
];

export const MOCK_JADWAL: Jadwal[] = [
  {
    id: "jadwal-1",
    guru_id: "guru-1-data-id",
    kelas_id: "k-7a",
    mata_pelajaran: "Ilmu Pengetahuan Alam",
    hari: "SENIN",
    jam_mulai: "06:30:00",
    jam_selesai: "08:30:00",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "jadwal-2",
    guru_id: "guru-1-data-id",
    kelas_id: "k-7a",
    mata_pelajaran: "Matematika",
    hari: "SENIN",
    jam_mulai: "09:00:00",
    jam_selesai: "11:00:00",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "jadwal-3",
    guru_id: "guru-1-data-id",
    kelas_id: "k-7a",
    mata_pelajaran: "Biologi",
    hari: "SENIN",
    jam_mulai: "11:00:00",
    jam_selesai: "13:00:00",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
];

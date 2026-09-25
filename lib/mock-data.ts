import { Akun, Kelas, Jadwal, Guru } from "@/types/schema";
import type { AdminActivity, AdminJadwalItem, AdminAkunItem } from "@/types/admin";
import type { KepsekStats, KehadiranHariIni, MengajarHariIni } from "@/types/kepsek";

// Re-export admin types untuk backward compatibility
export type { AdminActivity, AdminJadwalItem, AdminAkunItem };

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
    nama: "Admin Sekolah",
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

export const MOCK_ADMIN_STATS = {
  totalGuru: 48,
  totalJadwal: 126,
  totalAkun: 45,
};

export const MOCK_ADMIN_ACTIVITIES: AdminActivity[] = [
  { id: "act-1", aktivitas: "Data guru diperbarui", pengguna: "Admin Sekolah", waktu: "10:24", status: "Berhasil" },
  { id: "act-2", aktivitas: "Akun guru diaktifkan", pengguna: "Admin Sekolah", waktu: "09:15", status: "Berhasil" },
  { id: "act-3", aktivitas: "Data guru ditambahkan", pengguna: "Admin Sekolah", waktu: "09:00", status: "Berhasil" },
  { id: "act-4", aktivitas: "Jadwal diperbarui", pengguna: "Admin Sekolah", waktu: "08:00", status: "Berhasil" },
  { id: "act-5", aktivitas: "Akun guru diperbarui", pengguna: "Admin Sekolah", waktu: "07:40", status: "Berhasil" },
  { id: "act-6", aktivitas: "Data guru diperbarui", pengguna: "Admin Sekolah", waktu: "07:20", status: "Berhasil" },
  { id: "act-7", aktivitas: "Jadwal baru ditambahkan", pengguna: "Admin Sekolah", waktu: "07:10", status: "Berhasil" },
  { id: "act-8", aktivitas: "Data guru diperbarui", pengguna: "Admin Sekolah", waktu: "07:00", status: "Berhasil" },
  { id: "act-9", aktivitas: "Akun guru diaktifkan", pengguna: "Admin Sekolah", waktu: "06:40", status: "Berhasil" },
  { id: "act-10", aktivitas: "Data guru ditambahkan", pengguna: "Admin Sekolah", waktu: "06:30", status: "Berhasil" },
];

export const MOCK_GURU_LIST: Guru[] = [
  {
    id: "guru-1",
    nama: "Ahmad Fauzan, S.Pd.",
    nip: "1987011201",
    jabatan: "Guru Matematika",
    no_telepon: "0812 3344 5566",
    alamat: "Jl. Pendidikan No. 10, Bandung",
    jenis_kelamin: "Laki-Laki",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-2",
    nama: "Siti Rahmawati, S.Pd.",
    nip: "1990022103",
    jabatan: "Guru Bahasa",
    no_telepon: "0813 7788 9911",
    alamat: "Jl. Merdeka No. 45, Karawang",
    jenis_kelamin: "Perempuan",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-3",
    nama: "Dimas Pratama, S.Pd.",
    nip: "1989111405",
    jabatan: "Guru Produktif",
    no_telepon: "0821 4455 6677",
    alamat: "Jl. Sudirman No. 12, Bandung",
    jenis_kelamin: "Laki-Laki",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-4",
    nama: "Nadia Kusuma, S.Pd.",
    nip: "1993061708",
    jabatan: "Wali Kelas",
    no_telepon: "0857 3322 1144",
    alamat: "Jl. Mawar No. 8, Karawang",
    jenis_kelamin: "Perempuan",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-5",
    nama: "Rudi Hartono, S.Pd.",
    nip: "1985020409",
    jabatan: "Guru Olahraga",
    no_telepon: "0819 9012 4567",
    alamat: "Jl. Pemuda No. 22, Bandung",
    jenis_kelamin: "Laki-Laki",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-6",
    nama: "Lina Marlina, S.Pd.",
    nip: "1991082111",
    jabatan: "Guru IPA",
    no_telepon: "0812 7700 3322",
    alamat: "Jl. Anggrek No. 15, Karawang",
    jenis_kelamin: "Perempuan",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-7",
    nama: "Ahmad Fauzan, S.Pd.",
    nip: "1987011201",
    jabatan: "Guru Matematika",
    no_telepon: "0812 3344 5566",
    alamat: "Jl. Pendidikan No. 10, Bandung",
    jenis_kelamin: "Laki-Laki",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-8",
    nama: "Siti Rahmawati, S.Pd.",
    nip: "1990022103",
    jabatan: "Guru Bahasa",
    no_telepon: "0813 7788 9911",
    alamat: "Jl. Merdeka No. 45, Karawang",
    jenis_kelamin: "Perempuan",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-9",
    nama: "Dimas Pratama, S.Pd.",
    nip: "1989111405",
    jabatan: "Guru Produktif",
    no_telepon: "0821 4455 6677",
    alamat: "Jl. Sudirman No. 12, Bandung",
    jenis_kelamin: "Laki-Laki",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
  {
    id: "guru-10",
    nama: "Nadia Kusuma, S.Pd.",
    nip: "1993061708",
    jabatan: "Wali Kelas",
    no_telepon: "0857 3322 1144",
    alamat: "Jl. Mawar No. 8, Karawang",
    jenis_kelamin: "Perempuan",
    status: "AKTIF",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_ADMIN_JADWAL_LIST: AdminJadwalItem[] = [
  { id: "jadwal-adm-1", hari: "Senin", jam_mulai: "07:00", jam_selesai: "08:30", mata_pelajaran: "Matematika", kelas: "VII A", guru: "Ahmad Fauzan S.Pd." },
  { id: "jadwal-adm-2", hari: "Senin", jam_mulai: "08:30", jam_selesai: "10:00", mata_pelajaran: "Bahasa Indonesia", kelas: "VIII C", guru: "Siti Rahmawati S.Pd." },
  { id: "jadwal-adm-3", hari: "Selasa", jam_mulai: "07:00", jam_selesai: "09:15", mata_pelajaran: "Seni Budaya", kelas: "IX A", guru: "Dimas Pratama S.Pd." },
  { id: "jadwal-adm-4", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "11:45", mata_pelajaran: "IPA", kelas: "VII D", guru: "Lina Marlina S.Pd." },
  { id: "jadwal-adm-5", hari: "Kamis", jam_mulai: "07:00", jam_selesai: "08:30", mata_pelajaran: "Olahraga", kelas: "IX C", guru: "Rudi Hartono S.Pd." },
  { id: "jadwal-adm-6", hari: "Jumat", jam_mulai: "08:00", jam_selesai: "09:30", mata_pelajaran: "Kimia", kelas: "VIII B", guru: "Dimas Pratama S.Pd." },
  { id: "jadwal-adm-7", hari: "Senin", jam_mulai: "07:00", jam_selesai: "08:30", mata_pelajaran: "Matematika", kelas: "VII A", guru: "Ahmad Fauzan S.Pd." },
  { id: "jadwal-adm-8", hari: "Senin", jam_mulai: "08:30", jam_selesai: "10:00", mata_pelajaran: "Bahasa Indonesia", kelas: "VIII C", guru: "Siti Rahmawati S.Pd." },
  { id: "jadwal-adm-9", hari: "Selasa", jam_mulai: "07:00", jam_selesai: "09:15", mata_pelajaran: "Seni Budaya", kelas: "IX A", guru: "Dimas Pratama S.Pd." },
  { id: "jadwal-adm-10", hari: "Rabu", jam_mulai: "10:15", jam_selesai: "11:45", mata_pelajaran: "IPA", kelas: "VII D", guru: "Lina Marlina S.Pd." },
];

// ─── KELOLA AKUN ────────────────────────────────────────────────────────────

export const MOCK_ADMIN_AKUN_LIST: AdminAkunItem[] = [
  { id: "akun-1", nama: "Admin Sekolah", username: "admin.sekolah", nip: "1980010101", password: "admin123", role: "ADMIN", status: "AKTIF", terakhir_dilihat: "Hari ini, 10:24", created_at: "2026-01-01" },
  { id: "akun-2", nama: "Drs. Budi Santoso", username: "kepala.sekolah", nip: "1975031201", password: "kepsek123", role: "KEPSEK", status: "AKTIF", terakhir_dilihat: "Hari ini, 08:10", created_at: "2026-01-01" },
  { id: "akun-3", nama: "Ahmad Fauzan, S.Pd.", username: "ahmad.f", nip: "1987011201", password: "guru1234", role: "GURU", status: "AKTIF", terakhir_dilihat: "Kemarin, 15:41", created_at: "2026-01-10" },
  { id: "akun-4", nama: "Siti Rahmawati, S.Pd.", username: "siti.r", nip: "1990022103", password: "guru1234", role: "GURU", status: "AKTIF", terakhir_dilihat: "Kemarin, 14:20", created_at: "2026-01-11" },
  { id: "akun-5", nama: "Dimas Pratama, S.Pd.", username: "dimas.p", nip: "1989111405", password: "guru1234", role: "GURU", status: "AKTIF", terakhir_dilihat: "16 Sep 2026", created_at: "2026-01-12" },
  { id: "akun-6", nama: "Rudi Hartono, S.Pd.", username: "rudi.h", nip: "1985020409", password: "guru1234", role: "GURU", status: "NONAKTIF", terakhir_dilihat: "14 Sep 2026", created_at: "2026-01-14" },
  { id: "akun-7", nama: "Ahmad Fauzan, S.Pd.", username: "ahmad.f", nip: "1987011201", password: "guru1234", role: "GURU", status: "AKTIF", terakhir_dilihat: "Kemarin, 15:41", created_at: "2026-02-01" },
  { id: "akun-8", nama: "Siti Rahmawati, S.Pd.", username: "siti.r", nip: "1990022103", password: "guru1234", role: "GURU", status: "AKTIF", terakhir_dilihat: "Kemarin, 14:20", created_at: "2026-02-02" },
  { id: "akun-9", nama: "Dimas Pratama, S.Pd.", username: "dimas.p", nip: "1989111405", password: "guru1234", role: "GURU", status: "AKTIF", terakhir_dilihat: "16 Sep 2026", created_at: "2026-02-03" },
  { id: "akun-10", nama: "Rudi Hartono, S.Pd.", username: "rudi.h", nip: "1985020409", password: "guru1234", role: "GURU", status: "NONAKTIF", terakhir_dilihat: "14 Sep 2026", created_at: "2026-02-05" },
];

// ─── KEPSEK (KEPALA SEKOLAH) ────────────────────────────────────────────────

export const MOCK_KEPSEK_STATS: KepsekStats = {
  guruHadir: 44,
  izin: 2,
  sakit: 1,
  belumAbsen: 1,
};

export const MOCK_KEHADIRAN_HARI_INI: KehadiranHariIni[] = [
  { id: "kh-1", nama_guru: "Ahmad Fauzan, S.Pd.", waktu_masuk: "06:52", status: "Hadir" },
  { id: "kh-2", nama_guru: "Siti Rahmawati, S.Pd.", waktu_masuk: "06:58", status: "Hadir" },
  { id: "kh-3", nama_guru: "Dimas Pratama, S.Pd.", waktu_masuk: null, status: "Izin" },
  { id: "kh-4", nama_guru: "Nadia Kusuma, S.Pd.", waktu_masuk: "07:06", status: "Hadir" },
];

export const MOCK_MENGAJAR_HARI_INI: MengajarHariIni[] = [
  { id: "mh-1", nama_guru: "Ahmad Fauzan, S.Pd.", mata_pelajaran: "Matematika", kelas: "VII A", jam_mengajar: "07:00 - 08:30", status: "Mengajar" },
  { id: "mh-2", nama_guru: "Siti Rahmawati, S.Pd.", mata_pelajaran: "IPA", kelas: "VIII B", jam_mengajar: "08:30 - 10:00", status: "Mengajar" },
  { id: "mh-3", nama_guru: "Dimas Pratama, S.Pd.", mata_pelajaran: "Seni Budaya", kelas: "VII D", jam_mengajar: "08:30 - 10:00", status: "Mengajar" },
  { id: "mh-4", nama_guru: "Nadia Kusuma, S.Pd.", mata_pelajaran: "Olahraga", kelas: "IX A", jam_mengajar: "10:00 - 11:30", status: "Mengajar" },
];

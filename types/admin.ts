/**
 * ADMIN TYPES
 *
 * Tipe data yang digunakan oleh komponen-komponen Admin:
 * - AdminActivity: Log aktivitas di dashboard
 * - AdminJadwalItem: Data jadwal untuk manajemen admin
 * - AdminAkunItem: Data akun untuk manajemen admin
 */

export interface AdminActivity {
  id: string;
  aktivitas: string;
  pengguna: string;
  waktu: string;
  status: "Berhasil" | "Gagal" | "Pending";
}

export interface AdminJadwalItem {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran: string;
  kelas: string;
  guru: string;
}

export interface AdminAkunItem {
  id: string;
  nama: string;
  username: string;
  nip?: string;
  password?: string; // plain text for mock/demo purposes
  role: "ADMIN" | "GURU" | "KEPSEK";
  status: "AKTIF" | "NONAKTIF";
  terakhir_dilihat: string; // e.g. "Hari ini, 10:24" | "Kemarin, 15:41" | "16 Sep 2026"
  created_at: string;
}

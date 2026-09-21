import { Akun } from "@/types/schema";

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

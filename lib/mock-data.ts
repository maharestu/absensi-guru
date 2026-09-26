import { Akun, Guru, Kelas, Jadwal, HariJadwal } from "@/types/schema";

// ── MOCK USERS (Akun Login) ──
export const MOCK_USERS: Akun[] = [
  {
    id: "guru-1",
    username: "123", // NIP contoh login
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

// ── MOCK GURU ──
export const MOCK_GURU: Guru[] = [
  {
    id: "guru-1-data-id",
    nip: "123",
    nama: "Budi Santoso, S.Pd.",
    jabatan: "Guru Mata Pelajaran Matematika",
    no_telepon: "081234567890",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

// ── MOCK KELAS ──
export const MOCK_KELAS: Kelas[] = [
  {
    id: "kelas-x-mipa-1",
    nama_kelas: "X MIPA 1",
    kode_qr: "QR-KELAS-X-MIPA-1",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "kelas-x-mipa-2",
    nama_kelas: "X MIPA 2",
    kode_qr: "QR-KELAS-X-MIPA-2",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "kelas-xi-mipa-1",
    nama_kelas: "XI MIPA 1",
    kode_qr: "QR-KELAS-XI-MIPA-1",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "kelas-xi-ips-1",
    nama_kelas: "XI IPS 1",
    kode_qr: "QR-KELAS-XI-IPS-1",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "kelas-xii-mipa-1",
    nama_kelas: "XII MIPA 1",
    kode_qr: "QR-KELAS-XII-MIPA-1",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

// ── MOCK JADWAL MENGAJAR ──
export const MOCK_JADWAL: Jadwal[] = [
  // SENIN
  {
    id: "jadwal-senin-1",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-x-mipa-1",
    mata_pelajaran: "Matematika Wajib",
    hari: "SENIN",
    jam_mulai: "07:30:00",
    jam_selesai: "09:00:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "jadwal-senin-2",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xi-mipa-1",
    mata_pelajaran: "Matematika Peminatan",
    hari: "SENIN",
    jam_mulai: "09:30:00",
    jam_selesai: "11:00:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },

  // SELASA
  {
    id: "jadwal-selasa-1",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-x-mipa-2",
    mata_pelajaran: "Matematika Wajib",
    hari: "SELASA",
    jam_mulai: "08:00:00",
    jam_selesai: "09:30:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "jadwal-selasa-2",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xii-mipa-1",
    mata_pelajaran: "Matematika Wajib",
    hari: "SELASA",
    jam_mulai: "10:00:00",
    jam_selesai: "11:30:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },

  // RABU
  {
    id: "jadwal-rabu-1",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xi-ips-1",
    mata_pelajaran: "Matematika Wajib",
    hari: "RABU",
    jam_mulai: "07:30:00",
    jam_selesai: "09:00:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "jadwal-rabu-2",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xi-mipa-1",
    mata_pelajaran: "Matematika Peminatan",
    hari: "RABU",
    jam_mulai: "09:30:00",
    jam_selesai: "11:00:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },

  // KAMIS
  {
    id: "jadwal-kamis-1",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-x-mipa-1",
    mata_pelajaran: "Matematika Wajib",
    hari: "KAMIS",
    jam_mulai: "08:00:00",
    jam_selesai: "09:30:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "jadwal-kamis-2",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xii-mipa-1",
    mata_pelajaran: "Matematika Peminatan",
    hari: "KAMIS",
    jam_mulai: "10:00:00",
    jam_selesai: "11:30:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },

  // JUMAT
  {
    id: "jadwal-jumat-1",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-x-mipa-2",
    mata_pelajaran: "Matematika Wajib",
    hari: "JUMAT",
    jam_mulai: "07:30:00",
    jam_selesai: "09:00:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },

  // SABTU (berguna untuk testing jika dev dilakukan di akhir pekan)
  {
    id: "jadwal-sabtu-1",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xii-mipa-1",
    mata_pelajaran: "Pendalaman Materi Matematika",
    hari: "SABTU",
    jam_mulai: "08:00:00",
    jam_selesai: "09:30:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "jadwal-sabtu-2",
    guru_id: "guru-1-data-id",
    kelas_id: "kelas-xi-mipa-1",
    mata_pelajaran: "Bimbingan Olimpiade Matematika",
    hari: "SABTU",
    jam_mulai: "10:00:00",
    jam_selesai: "11:30:00",
    status: "AKTIF",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

// ── HELPER FUNCTIONS ──

/**
 * Mendapatkan nama hari dalam format HariJadwal ("SENIN" | "SELASA" | dst.) dari objek Date
 */
export function getHariFromDate(date: Date = new Date()): HariJadwal {
  const days: HariJadwal[] = [
    "MINGGU",
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUMAT",
    "SABTU",
  ];
  return days[date.getDay()];
}

/**
 * Mengambil jadwal guru berdasarkan guru_id dan opsi hari (default: hari ini)
 */
export function getJadwalGuru(guruId: string, hari?: HariJadwal): (Jadwal & { kelas?: Kelas })[] {
  const filterHari = hari ?? getHariFromDate();
  return MOCK_JADWAL.filter(
    (j) => j.guru_id === guruId && j.hari === filterHari && j.status === "AKTIF"
  ).map((j) => ({
    ...j,
    kelas: MOCK_KELAS.find((k) => k.id === j.kelas_id),
  }));
}

/**
 * Mencari data kelas berdasarkan kelas_id
 */
export function getKelasById(kelasId: string): Kelas | undefined {
  return MOCK_KELAS.find((k) => k.id === kelasId);
}

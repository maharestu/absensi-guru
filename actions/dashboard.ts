"use server";

/**
 * SERVER ACTIONS — DASHBOARD STATS
 * Hitung statistik untuk dashboard Admin dan Kepala Sekolah.
 */

import { supabaseAdmin } from "@/lib/supabase";

// ── Tipe data ─────────────────────────────────────────────────

export interface AdminStats {
  totalGuru: number;
  totalJadwal: number;
  totalAkun: number;
}

export interface KepsekStats {
  guruHadir: number;
  izin: number;
  sakit: number;
  belumAbsen: number;
}

export interface KehadiranHariIni {
  id: string;
  nama_guru: string;
  waktu_masuk: string | null;
  status: string;
}

export interface MengajarHariIni {
  id: string;
  nama_guru: string;
  mata_pelajaran: string;
  kelas: string;
  jam_mengajar: string;
  status: string;
}

// ── Admin Stats ───────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const [guruRes, jadwalRes, akunRes] = await Promise.all([
    supabaseAdmin.from("guru").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("jadwal").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("akun").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalGuru: guruRes.count ?? 0,
    totalJadwal: jadwalRes.count ?? 0,
    totalAkun: akunRes.count ?? 0,
  };
}

export interface ActivityItem {
  id: string;
  aktivitas: string;
  pengguna: string;
  waktu: string;
  status: string;
}

export async function getRecentActivities(): Promise<ActivityItem[]> {
  const { data, error } = await supabaseAdmin
    .from("absensi_masuk")
    .select("id, status, waktu_submit, guru(nama)")
    .order("waktu_submit", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Gagal mengambil aktivitas terbaru:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    aktivitas:
      row.status === "hadir"
        ? "Presensi Masuk"
        : row.status === "izin"
        ? "Pengajuan Izin"
        : "Pengajuan Sakit",
    // @ts-expect-error — nested join
    pengguna: row.guru?.nama ?? "Guru",
    waktu: row.waktu_submit
      ? new Date(row.waktu_submit).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",
    status: "Berhasil",
  }));
}

// ── Kepsek Stats ──────────────────────────────────────────────

export async function getKepsekStats(): Promise<KepsekStats> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Hitung total guru aktif
  const { count: totalGuru } = await supabaseAdmin
    .from("guru")
    .select("id", { count: "exact", head: true })
    .eq("status", "aktif");

  // Hitung absensi hari ini per status
  const { data: absensiHariIni } = await supabaseAdmin
    .from("absensi_masuk")
    .select("status")
    .eq("tanggal", today);

  const hadir = absensiHariIni?.filter((a) => a.status === "hadir").length ?? 0;
  const izin = absensiHariIni?.filter((a) => a.status === "izin").length ?? 0;
  const sakit = absensiHariIni?.filter((a) => a.status === "sakit").length ?? 0;
  const sudahAbsen = (absensiHariIni?.length ?? 0);
  const belumAbsen = Math.max(0, (totalGuru ?? 0) - sudahAbsen);

  return { guruHadir: hadir, izin, sakit, belumAbsen };
}

// ── Kepsek: Tabel Kehadiran Hari Ini ─────────────────────────

export async function getKehadiranHariIni(): Promise<KehadiranHariIni[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("absensi_masuk")
    .select("id, status, waktu_submit, guru(nama)")
    .eq("tanggal", today)
    .order("waktu_submit");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    // @ts-expect-error — supabase join returns nested object
    nama_guru: row.guru?.nama ?? "-",
    waktu_masuk:
      row.status === "hadir"
        ? new Date(row.waktu_submit).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    status:
      row.status === "hadir"
        ? "Hadir"
        : row.status === "izin"
        ? "Izin"
        : "Sakit",
  }));
}

// ── Kepsek: Tabel Mengajar Hari Ini ──────────────────────────

export async function getMengajarHariIni(): Promise<MengajarHariIni[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("absensi_mengajar")
    .select(
      "id, waktu_submit, jadwal(mata_pelajaran, jam_mulai, jam_selesai, guru(nama), kelas(nama_kelas))"
    )
    .eq("tanggal", today)
    .order("waktu_submit");

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => {
    const jadwal = Array.isArray(row.jadwal) ? row.jadwal[0] : row.jadwal;
    const guru = Array.isArray(jadwal?.guru) ? jadwal?.guru[0] : jadwal?.guru;
    const kelas = Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0] : jadwal?.kelas;

    return {
      id: row.id,
      nama_guru: guru?.nama ?? "-",
      mata_pelajaran: jadwal?.mata_pelajaran ?? "-",
      kelas: kelas?.nama_kelas ?? "-",
      jam_mengajar: jadwal
        ? `${jadwal.jam_mulai} - ${jadwal.jam_selesai}`
        : "-",
      status: "Sudah Mengajar",
    };
  });
}

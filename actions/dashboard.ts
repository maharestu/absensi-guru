"use server";

/**
 * SERVER ACTIONS — DASHBOARD STATS
 * Hitung statistik untuk dashboard Admin dan Kepala Sekolah.
 */

import { supabaseAdmin } from "@/lib/supabase";
import {
  getTodayWIB,
  formatJamWIB,
  hitungKeterlambatan,
  JAM_MASUK_SEKOLAH,
  TOLERANSI_TERLAMBAT_MENIT,
  KeterlambatanInfo,
  isWeekendWIB,
  isPastCutoffTodayWIB,
  TANGGAL_MULAI_TIDAK_HADIR,
  getFaseWaktuSekolah,
} from "@/lib/date";
import {
  isHariLibur,
  isLiburPanjang,
  getStatusOperasionalHariIni,
} from "@/actions/pengaturan";
import { STATUS_AKTIVITAS_LABEL, STATUS_MASUK_LABEL } from "@/lib/status";
import { StatusAbsensiMasuk } from "@/types/schema";

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
  dinas: number;
  belumAbsen: number;
}

export interface KehadiranHariIni {
  id: string;
  nama_guru: string;
  waktu_masuk: string | null;
  status: string;
  terlambat?: boolean;
  menit_terlambat?: number;
  keterangan_terlambat?: string;
  foto_absensi?: string | null;
  file_bukti_izin_sakit?: string | null;
  waktu_submit?: string | null; // Tambahkan untuk keperluan sorting
}

export interface MengajarHariIni {
  id: string;
  nama_guru: string;
  mata_pelajaran: string;
  kelas: string;
  waktu_absen: string;
  jam_mengajar: string;
  status: string;
  terlambat?: boolean;
  menit_terlambat?: number;
  keterangan_terlambat?: string;
  foto_absensi?: string | null;
}

// ── Admin Stats ───────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const [guruRes, jadwalRes, akunRes] = await Promise.all([
    supabaseAdmin
      .from("guru")
      .select("id", { count: "exact", head: true })
      .eq("status", "aktif"),
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
    aktivitas: STATUS_AKTIVITAS_LABEL[row.status as StatusAbsensiMasuk] || "Lainnya",
    // @ts-expect-error — nested join
    pengguna: row.guru?.nama ?? "Guru",
    waktu: row.waktu_submit
      ? formatJamWIB(row.waktu_submit)
      : "-",
    status: "Berhasil",
  }));
}

// ── Kepsek Stats ──────────────────────────────────────────────

export async function getKepsekStats(): Promise<KepsekStats> {
  const today = getTodayWIB();
  const fase = getFaseWaktuSekolah();

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
  const dinas = absensiHariIni?.filter((a) => a.status === "dinas").length ?? 0;
  const sudahAbsen = (absensiHariIni?.length ?? 0);

  // Cek status operasional harian (libur panjang, tanggal merah, weekend)
  const statusOp = await getStatusOperasionalHariIni(today);

  // Jika akhir pekan, sebelum jam masuk, atau hari libur / libur panjang → belumAbsen = 0
  const belumAbsen = (!statusOp.isOperasional || fase === "sebelum_masuk")
    ? 0
    : Math.max(0, (totalGuru ?? 0) - sudahAbsen);

  return { guruHadir: hadir, izin, sakit, dinas, belumAbsen };
}

// ── Kepsek: Tabel Kehadiran Hari Ini ─────────────────────────

export async function getKehadiranHariIni(): Promise<KehadiranHariIni[]> {
  const today = getTodayWIB();
  const fase = getFaseWaktuSekolah();
  const isEffective = today >= TANGGAL_MULAI_TIDAK_HADIR;
  const isSetelahPulang = fase === "setelah_pulang" && isEffective;
  
  // Cek status operasional harian
  const statusOp = await getStatusOperasionalHariIni(today);
  const isLibur = !statusOp.isOperasional;
  const statusBelumAbsen = isSetelahPulang ? "Tidak Hadir" : "Belum Hadir";

  // 1. Ambil semua data absensi masuk hari ini & data master guru aktif
  const [absensiRes, guruRes] = await Promise.all([
    supabaseAdmin
      .from("absensi_masuk")
      .select("id, guru_id, status, waktu_submit, foto_absensi, file_bukti_izin_sakit")
      .eq("tanggal", today),
    supabaseAdmin
      .from("guru")
      .select("id, nama")
      .eq("status", "aktif")
  ]);

  if (absensiRes.error) throw new Error(absensiRes.error.message);
  if (guruRes.error) throw new Error(guruRes.error.message);

  const allGuru = guruRes.data || [];
  const allAbsensi = absensiRes.data || [];

  // Jika hari libur / libur panjang dan belum ada absensi tercatat, kembalikan array kosong (laporan kosong seperti weekend)
  if (isLibur && allAbsensi.length === 0) {
    return [];
  }

  // Map absensi berdasarkan guru_id untuk memudahkan pencarian
  const absensiMap = new Map<string, any>();
  allAbsensi.forEach(row => {
    absensiMap.set(row.guru_id, row);
  });

  // 2. Gabungkan data: Jika hari libur hanya tampilkan guru yang sudah absen, hari biasa tampilkan semua guru
  const targetGuru = isLibur
    ? allGuru.filter(g => absensiMap.has(g.id))
    : allGuru;

  const finalData: KehadiranHariIni[] = targetGuru.map(g => {
    const abs = absensiMap.get(g.id);
    
    if (abs) {
      let ketInfo: KeterlambatanInfo | null = null;
      if (abs.status === "hadir" && abs.waktu_submit) {
        ketInfo = hitungKeterlambatan(abs.waktu_submit, JAM_MASUK_SEKOLAH, TOLERANSI_TERLAMBAT_MENIT);
      }

      return {
        id: abs.id,
        nama_guru: g.nama || "-",
        waktu_masuk: abs.waktu_submit ? formatJamWIB(abs.waktu_submit) : null,
        status: STATUS_MASUK_LABEL[abs.status as StatusAbsensiMasuk] || abs.status,
        terlambat: ketInfo?.terlambat ?? false,
        menit_terlambat: ketInfo?.menit ?? 0,
        keterangan_terlambat: ketInfo?.label ?? "",
        foto_absensi: abs.foto_absensi ?? null,
        file_bukti_izin_sakit: abs.file_bukti_izin_sakit ?? null,
        waktu_submit: abs.waktu_submit // Simpan original timestamp untuk sorting
      };
    } else {
      // Guru belum absen hari ini (otomatis 'Tidak Hadir' jika waktu kerja sudah selesai)
      return {
        id: `unrecorded-${g.id}`,
        nama_guru: g.nama || "-",
        waktu_masuk: null,
        status: statusBelumAbsen,
        terlambat: false,
        menit_terlambat: 0,
        keterangan_terlambat: "",
        foto_absensi: null,
        file_bukti_izin_sakit: null,
        waktu_submit: null
      };
    }
  });

  // 3. Logika Pengurutan (Sorting):
  // - Level 1: Guru yang sudah absen (Hadir, Sakit, dsb) tampil di atas.
  // - Level 2: Di antara yang sudah absen, urutkan berdasarkan waktu terbaru (DESC).
  // - Level 3: Guru yang Belum/Tidak Hadir tampil di bawah, urutkan nama secara Alphabetis (ASC).
  return finalData.sort((a, b) => {
    const isAbsenA = a.waktu_submit !== null ? 0 : 1;
    const isAbsenB = b.waktu_submit !== null ? 0 : 1;

    // Jika status absen berbeda (satu sudah, satu belum/tidak hadir), yang sudah absen naik ke atas
    if (isAbsenA !== isAbsenB) {
      return isAbsenA - isAbsenB;
    }

    // Jika keduanya sudah absen, urutkan berdasarkan waktu submit terbaru
    if (isAbsenA === 0) {
      const timeA = a.waktu_submit ? new Date(a.waktu_submit).getTime() : 0;
      const timeB = b.waktu_submit ? new Date(b.waktu_submit).getTime() : 0;
      return timeB - timeA;
    }

    // Jika keduanya belum/tidak absen, urutkan berdasarkan nama
    return a.nama_guru.localeCompare(b.nama_guru);
  });
}

// ── Kepsek: Tabel Mengajar Hari Ini ──────────────────────────

export async function getMengajarHariIni(): Promise<MengajarHariIni[]> {
  const today = getTodayWIB();

  const { data, error } = await supabaseAdmin
    .from("absensi_mengajar")
    .select(
      "id, waktu_submit, foto_absensi, jadwal(mata_pelajaran, jam_mulai, jam_selesai, guru(nama), kelas(nama_kelas))"
    )
    .eq("tanggal", today)
    .order("waktu_submit");

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => {
    const jadwal = Array.isArray(row.jadwal) ? row.jadwal[0] : row.jadwal;
    const guru = Array.isArray(jadwal?.guru) ? jadwal?.guru[0] : jadwal?.guru;
    const kelas = Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0] : jadwal?.kelas;

    let ketInfo: KeterlambatanInfo | null = null;
    if (row.waktu_submit && jadwal?.jam_mulai) {
      ketInfo = hitungKeterlambatan(row.waktu_submit, jadwal.jam_mulai, TOLERANSI_TERLAMBAT_MENIT);
    }

    return {
      id: row.id,
      nama_guru: guru?.nama ?? "-",
      mata_pelajaran: jadwal?.mata_pelajaran ?? "-",
      kelas: kelas?.nama_kelas ?? "-",
      waktu_absen: row.waktu_submit ? formatJamWIB(row.waktu_submit) : "-",
      jam_mengajar: jadwal
        ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)}`
        : "-",
      status: "Sudah Mengajar",
      terlambat: ketInfo?.terlambat ?? false,
      menit_terlambat: ketInfo?.menit ?? 0,
      keterangan_terlambat: ketInfo?.label ?? "",
      foto_absensi: row.foto_absensi ?? null,
    };
  });
}

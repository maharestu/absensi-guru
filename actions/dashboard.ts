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
  getPengaturanSistem,
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
    .neq("status", "tidak_hadir")
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

// ── Sinkronisasi Otomatis Status "Tidak Hadir" ke Database ───

/**
 * Sinkronisasi otomatis status "tidak_hadir" ke database tabel absensi_masuk.
 * Dijalankan ketika waktu pulang sudah tiba (setelah cut-off) pada hari operasional.
 * Menyimpan rekaman fisik ke database, bukan sekadar status virtual di memori.
 */
export async function sinkronisasiTidakHadirHarian(targetDate?: string): Promise<{ synced: boolean; count: number }> {
  try {
    const dateStr = targetDate || getTodayWIB();
    const todayWIB = getTodayWIB();

    // 1. Validasi: Tidak boleh untuk tanggal di masa depan
    if (dateStr > todayWIB) return { synced: false, count: 0 };

    // 2. Validasi: Tanggal sebelum batas mulai berlakunya fitur tidak hadir dilewati
    if (dateStr < TANGGAL_MULAI_TIDAK_HADIR) return { synced: false, count: 0 };

    // 3. Ambil konfigurasi dinamis dari database (tabel pengaturan_sistem)
    const sysConfig = await getPengaturanSistem();

    // 4. Validasi: Jika tanggal hari ini, pastikan sudah lewat jam cut-off dinamis (waktu pulang)
    if (dateStr === todayWIB && !isPastCutoffTodayWIB(sysConfig.jam_cutoff)) {
      return { synced: false, count: 0 };
    }

    // 5. Validasi Hari Operasional: Tidak mencatat di akhir pekan, libur nasional, atau libur panjang
    const statusOp = await getStatusOperasionalHariIni(dateStr);
    if (!statusOp.isOperasional) {
      return { synced: false, count: 0 };
    }

    // 6. Ambil semua guru aktif dan absensi yang sudah ada pada tanggal tersebut
    const [guruRes, absensiRes] = await Promise.all([
      supabaseAdmin.from("guru").select("id").eq("status", "aktif"),
      supabaseAdmin.from("absensi_masuk").select("guru_id").eq("tanggal", dateStr),
    ]);

    if (guruRes.error || !guruRes.data) {
      console.error("Gagal mengambil data guru aktif untuk sinkronisasi tidak hadir:", guruRes.error);
      return { synced: false, count: 0 };
    }

    const existingGuruIds = new Set<string>((absensiRes.data ?? []).map((r) => r.guru_id));
    const unrecordedGurus = guruRes.data.filter((g) => !existingGuruIds.has(g.id));

    if (unrecordedGurus.length === 0) {
      return { synced: true, count: 0 };
    }

    // 7. Siapkan data insert batch dengan status "tidak_hadir" dan waktu cut-off dinamis
    const recordsToInsert = unrecordedGurus.map((g) => ({
      guru_id: g.id,
      tanggal: dateStr,
      status: "tidak_hadir",
      waktu_submit: `${dateStr}T${sysConfig.jam_cutoff}:00+07:00`,
    }));

    // 8. Simpan ke database dengan proteksi onConflict agar idempotent dan aman
    const { error: insertError } = await supabaseAdmin
      .from("absensi_masuk")
      .upsert(recordsToInsert, { onConflict: "guru_id, tanggal", ignoreDuplicates: true });

    if (insertError) {
      console.error("Gagal mencatat status tidak hadir otomatis ke database:", insertError);
      return { synced: false, count: 0 };
    }

    return { synced: true, count: recordsToInsert.length };
  } catch (err) {
    console.error("sinkronisasiTidakHadirHarian exception:", err);
    return { synced: false, count: 0 };
  }
}

// ── Kepsek Stats ──────────────────────────────────────────────

export async function getKepsekStats(): Promise<KepsekStats> {
  const today = getTodayWIB();
  const fase = getFaseWaktuSekolah();
  const isEffective = today >= TANGGAL_MULAI_TIDAK_HADIR;
  const isSetelahPulang = fase === "setelah_pulang" && isEffective;

  // Cek status operasional harian (libur panjang, tanggal merah, weekend)
  const statusOp = await getStatusOperasionalHariIni(today);
  const isOperasional = statusOp.isOperasional;

  // Jika waktu pulang sudah tiba di hari operasional, lakukan sinkronisasi otomatis ke database
  if (isSetelahPulang && isOperasional) {
    await sinkronisasiTidakHadirHarian(today);
  }

  // Hitung total guru aktif
  const { count: totalGuru } = await supabaseAdmin
    .from("guru")
    .select("id", { count: "exact", head: true })
    .eq("status", "aktif");

  // Hitung absensi hari ini per status dari database
  const { data: absensiHariIni } = await supabaseAdmin
    .from("absensi_masuk")
    .select("status")
    .eq("tanggal", today);

  const hadir = absensiHariIni?.filter((a) => a.status === "hadir").length ?? 0;
  const izin = absensiHariIni?.filter((a) => a.status === "izin").length ?? 0;
  const sakit = absensiHariIni?.filter((a) => a.status === "sakit").length ?? 0;
  const dinas = absensiHariIni?.filter((a) => a.status === "dinas").length ?? 0;
  const tidakHadir = absensiHariIni?.filter((a) => a.status === "tidak_hadir").length ?? 0;

  const totalMandiri = hadir + izin + sakit + dinas;

  // Jika akhir pekan, sebelum jam masuk, atau hari libur / libur panjang → belumAbsen = 0
  // Jika setelah pulang: nilai adalah jumlah guru tidak hadir (yang kini sudah tersimpan di database)
  // Jika sedang jam sekolah: nilai adalah guru aktif yang belum absen mandiri
  let belumAbsen = 0;
  if (isOperasional && fase !== "sebelum_masuk") {
    if (isSetelahPulang) {
      belumAbsen = tidakHadir > 0 ? tidakHadir : Math.max(0, (totalGuru ?? 0) - totalMandiri);
    } else {
      belumAbsen = Math.max(0, (totalGuru ?? 0) - totalMandiri);
    }
  }

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

  // Jika waktu pulang sudah tiba di hari operasional, lakukan sinkronisasi otomatis ke database
  if (isSetelahPulang && !isLibur) {
    await sinkronisasiTidakHadirHarian(today);
  }

  // 1. Ambil semua data absensi masuk hari ini, data master guru aktif & konfigurasi sistem dinamis
  const [absensiRes, guruRes, sysConfig] = await Promise.all([
    supabaseAdmin
      .from("absensi_masuk")
      .select("id, guru_id, status, waktu_submit, foto_absensi, file_bukti_izin_sakit")
      .eq("tanggal", today),
    supabaseAdmin
      .from("guru")
      .select("id, nama")
      .eq("status", "aktif"),
    getPengaturanSistem(),
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
      const isTidakHadir = abs.status === "tidak_hadir";
      let ketInfo: KeterlambatanInfo | null = null;
      if (abs.status === "hadir" && abs.waktu_submit) {
        ketInfo = hitungKeterlambatan(abs.waktu_submit, sysConfig.jam_masuk, sysConfig.toleransi_menit);
      }

      return {
        id: abs.id,
        nama_guru: g.nama || "-",
        waktu_masuk: isTidakHadir ? null : (abs.waktu_submit ? formatJamWIB(abs.waktu_submit) : null),
        status: STATUS_MASUK_LABEL[abs.status as StatusAbsensiMasuk] || abs.status,
        terlambat: isTidakHadir ? false : (ketInfo?.terlambat ?? false),
        menit_terlambat: isTidakHadir ? 0 : (ketInfo?.menit ?? 0),
        keterangan_terlambat: isTidakHadir ? "" : (ketInfo?.label ?? ""),
        foto_absensi: abs.foto_absensi ?? null,
        file_bukti_izin_sakit: abs.file_bukti_izin_sakit ?? null,
        waktu_submit: isTidakHadir ? null : abs.waktu_submit // Tetap null agar sorting Level 1 menempatkan Tidak Hadir di bawah
      };
    } else {
      // Guru belum absen hari ini (muncul sebelum cutoff jam sekolah tiba atau jika mode libur)
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

"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { formatJamWIB, getTodayWIB, isWeekendWIB, isPastCutoffTodayWIB, TANGGAL_MULAI_TIDAK_HADIR } from "@/lib/date";

export interface LaporanKehadiran {
  id: string;
  guru_id: string;
  tanggal: string;
  raw_tanggal?: string;
  nama: string;
  waktu_masuk: string;
  status: string;
  foto_absensi?: string | null;
  file_bukti_izin_sakit?: string | null;
}

export interface LaporanMengajar {
  id: string;
  guru_id: string;
  kelas_id: string;
  tanggal: string;
  nama: string;
  kelas: string;
  mata_pelajaran: string;
  waktu: string;
  status: string;
  foto_absensi?: string | null;
}

export async function getLaporanKehadiran(startDate?: string, endDate?: string): Promise<LaporanKehadiran[]> {
  let query = supabaseAdmin
    .from("absensi_masuk")
    .select("id, guru_id, tanggal, waktu_submit, status, foto_absensi, file_bukti_izin_sakit, guru(nama)")
    .order("waktu_submit", { ascending: false })
    .limit(1500);

  if (startDate) query = query.gte("tanggal", startDate);
  if (endDate) query = query.lte("tanggal", endDate);

  const [absensiRes, guruRes] = await Promise.all([
    query,
    supabaseAdmin.from("guru").select("id, nama").eq("status", "aktif")
  ]);

  if (absensiRes.error) throw new Error(absensiRes.error.message);
  if (guruRes.error) throw new Error(guruRes.error.message);

  const realRecords: LaporanKehadiran[] = (absensiRes.data ?? []).map((row: any) => ({
    id: row.id,
    guru_id: row.guru_id ?? "",
    tanggal: new Date(row.tanggal).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    raw_tanggal: typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "",
    nama: Array.isArray(row.guru) ? row.guru[0]?.nama : (row.guru?.nama ?? "-"),
    waktu_masuk: row.waktu_submit 
      ? formatJamWIB(row.waktu_submit)
      : "—",
    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    foto_absensi: row.foto_absensi,
    file_bukti_izin_sakit: row.file_bukti_izin_sakit
  }));

  // Rekonsiliasi data "Tidak Hadir" jika periode startDate & endDate ditentukan
  if (startDate && endDate) {
    const todayWIB = getTodayWIB();
    const isPastCutoff = isPastCutoffTodayWIB();
    const activeGurus = guruRes.data ?? [];

    // Map pencocokan absensi: key = `${guru_id}_${tanggal}`
    const existingSet = new Set<string>();
    for (const row of absensiRes.data ?? []) {
      if (row.guru_id && row.tanggal) {
        const tStr = typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "";
        existingSet.add(`${row.guru_id}_${tStr}`);
      }
    }

    // Iterasi deretan tanggal dari startDate sampai endDate
    const dates: string[] = [];
    const [sY, sM, sD] = startDate.split("-").map(Number);
    const [eY, eM, eD] = endDate.split("-").map(Number);
    const cur = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0));
    const end = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0));

    while (cur <= end) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
      const d = String(cur.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const unrecordedRows: LaporanKehadiran[] = [];

    for (const dateStr of dates) {
      // 1. Lewati tanggal sebelum fitur Tidak Hadir resmi berlaku (mulai Senin, 19 Okt 2026)
      if (dateStr < TANGGAL_MULAI_TIDAK_HADIR) continue;

      // 2. Lewati akhir pekan (Sabtu & Minggu bukan hari sekolah)
      if (isWeekendWIB(dateStr)) continue;

      // 3. Lewati tanggal di masa depan
      if (dateStr > todayWIB) continue;

      // 4. Untuk hari ini, belum absen baru dianggap "Tidak Hadir" setelah jam cut-off (16:00 WIB)
      if (dateStr === todayWIB && !isPastCutoff) continue;

      // Periksa setiap guru aktif
      for (const guru of activeGurus) {
        const key = `${guru.id}_${dateStr}`;
        if (!existingSet.has(key)) {
          const [yr, mo, da] = dateStr.split("-").map(Number);
          const dObj = new Date(Date.UTC(yr, mo - 1, da, 12, 0, 0));
          const formattedTanggal = dObj.toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "2-digit",
            month: "short",
            year: "numeric"
          });

          unrecordedRows.push({
            id: `tidak-hadir-${guru.id}-${dateStr}`,
            guru_id: guru.id,
            tanggal: formattedTanggal,
            raw_tanggal: dateStr,
            nama: guru.nama ?? "-",
            waktu_masuk: "—",
            status: "Tidak Hadir",
            foto_absensi: null,
            file_bukti_izin_sakit: null
          });
        }
      }
    }

    const combined = [...realRecords, ...unrecordedRows];
    // Urutkan berdasarkan tanggal terbaru lalu abjad nama guru
    combined.sort((a, b) => {
      const dateA = a.raw_tanggal || "";
      const dateB = b.raw_tanggal || "";
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return a.nama.localeCompare(b.nama);
    });

    return combined;
  }

  return realRecords;
}

export async function getLaporanMengajar(startDate?: string, endDate?: string): Promise<LaporanMengajar[]> {
  let query = supabaseAdmin
    .from("absensi_mengajar")
    .select("id, tanggal, waktu_submit, foto_absensi, jadwal(mata_pelajaran, jam_mulai, jam_selesai, guru_id, kelas_id, guru(nama), kelas(nama_kelas))")
    .order("waktu_submit", { ascending: false })
    .limit(1500);

  if (startDate) query = query.gte("tanggal", startDate);
  if (endDate) query = query.lte("tanggal", endDate);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const jadwal = Array.isArray(row.jadwal) ? row.jadwal[0] : row.jadwal;
    const guru = Array.isArray(jadwal?.guru) ? jadwal?.guru[0] : jadwal?.guru;
    const kelas = Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0] : jadwal?.kelas;

    return {
      id: row.id,
      guru_id: jadwal?.guru_id ?? "",
      kelas_id: jadwal?.kelas_id ?? "",
      tanggal: new Date(row.tanggal).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      nama: guru?.nama ?? "-",
      kelas: kelas?.nama_kelas ?? "-",
      mata_pelajaran: jadwal?.mata_pelajaran ?? "-",
      waktu: jadwal ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)}` : "-",
      status: "Mengajar",
      foto_absensi: row.foto_absensi
    };
  });
}

"use server";

import { supabaseAdmin } from "@/lib/supabase";

export interface LaporanKehadiran {
  id: string;
  guru_id: string;
  tanggal: string;
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
    .order("waktu_submit", { ascending: false });

  if (startDate) query = query.gte("tanggal", startDate);
  if (endDate) query = query.lte("tanggal", endDate);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    guru_id: row.guru_id ?? "",
    tanggal: new Date(row.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    nama: Array.isArray(row.guru) ? row.guru[0]?.nama : (row.guru?.nama ?? "-"),
    waktu_masuk: row.status === "hadir" 
      ? new Date(row.waktu_submit).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
      : "—",
    status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    foto_absensi: row.foto_absensi,
    file_bukti_izin_sakit: row.file_bukti_izin_sakit
  }));
}

export async function getLaporanMengajar(startDate?: string, endDate?: string): Promise<LaporanMengajar[]> {
  let query = supabaseAdmin
    .from("absensi_mengajar")
    .select("id, tanggal, waktu_submit, foto_absensi, jadwal(mata_pelajaran, jam_mulai, jam_selesai, guru_id, kelas_id, guru(nama), kelas(nama_kelas))")
    .order("waktu_submit", { ascending: false });

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

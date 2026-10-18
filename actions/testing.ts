"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getTodayWIB } from "@/lib/date";
import { getSession } from "@/lib/session";

/**
 * Reset riwayat absensi kehadiran dan mengajar guru untuk hari ini
 * Digunakan saat pengujian agar guru dapat melakukan tes berulang kali tanpa terhalang duplikasi.
 */
export async function resetPresensiGuruHariIniAction() {
  try {
    const session = await getSession();
    if (!session?.guru_id) {
      throw new Error("Sesi tidak valid atau Anda tidak terdaftar sebagai guru.");
    }

    const guruId = session.guru_id;
    const today = getTodayWIB();

    // 1. Hapus dari absensi_masuk hari ini
    const { error: errMasuk } = await supabaseAdmin
      .from("absensi_masuk")
      .delete()
      .eq("guru_id", guruId)
      .eq("tanggal", today);

    if (errMasuk) {
      console.error("Gagal reset absensi_masuk:", errMasuk);
    }

    // 2. Ambil jadwal milik guru ini untuk menghapus absensi_mengajar hari ini
    const { data: jadwalList } = await supabaseAdmin
      .from("jadwal")
      .select("id")
      .eq("guru_id", guruId);

    if (jadwalList && jadwalList.length > 0) {
      const jadwalIds = jadwalList.map((j) => j.id);
      const { error: errMengajar } = await supabaseAdmin
        .from("absensi_mengajar")
        .delete()
        .eq("tanggal", today)
        .in("jadwal_id", jadwalIds);

      if (errMengajar) {
        console.error("Gagal reset absensi_mengajar:", errMengajar);
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

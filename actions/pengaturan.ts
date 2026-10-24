"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { isWithinGeofence } from "@/lib/geo";
import { revalidatePath } from "next/cache";
import {
  JAM_MASUK_SEKOLAH,
  JAM_CUTOFF_ABSENSI,
  TOLERANSI_TERLAMBAT_MENIT,
  getTodayWIB,
  isWeekendWIB,
} from "@/lib/date";

// ── Tipe ──────────────────────────────────────────────────────

export interface PengaturanSistem {
  jam_masuk: string;        // "HH:MM"
  jam_cutoff: string;       // "HH:MM"
  toleransi_menit: number;
  libur_panjang_aktif?: boolean;
  libur_panjang_mulai?: string | null;      // "YYYY-MM-DD"
  libur_panjang_selesai?: string | null;    // "YYYY-MM-DD"
  libur_panjang_keterangan?: string | null;
}

export interface HariLibur {
  id: string;
  tanggal: string;          // "YYYY-MM-DD"
  keterangan: string;
}

// ── Lokasi Sekolah (fungsi existing — tidak diubah) ────────────

export async function getLokasiSekolah() {
  const { data, error } = await supabaseAdmin
    .from("pengaturan_lokasi_sekolah")
    .select("latitude, longitude, radius_meter")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Pengaturan lokasi sekolah tidak ditemukan di database.");
  }

  return data;
}

export async function verifikasiLokasiSekolah(userLat: number, userLng: number) {
  try {
    const config = await getLokasiSekolah();
    const isValid = isWithinGeofence(
      userLat,
      userLng,
      config.latitude,
      config.longitude,
      config.radius_meter
    );

    return {
      success: true,
      isValid,
      radiusMeter: config.radius_meter,
    };
  } catch (err: any) {
    console.error("verifikasiLokasiSekolah error:", err);
    return {
      success: false,
      isValid: false,
      error: err.message || "Gagal memverifikasi lokasi dari database.",
    };
  }
}

// ── Update Lokasi Sekolah ──────────────────────────────────────

export async function updateLokasiSekolah(
  latitude: number,
  longitude: number,
  radius_meter: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ambil baris existing (jika ada) untuk upsert
    const { data: existing } = await supabaseAdmin
      .from("pengaturan_lokasi_sekolah")
      .select("id")
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("pengaturan_lokasi_sekolah")
        .update({ latitude, longitude, radius_meter })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("pengaturan_lokasi_sekolah")
        .insert({ latitude, longitude, radius_meter });
      if (error) throw new Error(error.message);
    }

    revalidatePath("/admin/pengaturan");
    return { success: true };
  } catch (err: any) {
    console.error("updateLokasiSekolah error:", err);
    return { success: false, error: err.message };
  }
}

// ── Pengaturan Sistem (waktu & toleransi) ─────────────────────

/**
 * Ambil konfigurasi sistem dari database.
 * Jika tabel kosong atau terjadi error, kembalikan nilai default
 * yang identik dengan konstanta hardcoded di lib/date.ts.
 */
export async function getPengaturanSistem(): Promise<PengaturanSistem> {
  try {
    const { data, error } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("jam_masuk, jam_cutoff, toleransi_menit, libur_panjang_aktif, libur_panjang_mulai, libur_panjang_selesai, libur_panjang_keterangan")
      .maybeSingle();

    if (error || !data) {
      // Fallback ke konstanta hardcoded — perilaku tidak berubah
      return {
        jam_masuk: JAM_MASUK_SEKOLAH,
        jam_cutoff: JAM_CUTOFF_ABSENSI,
        toleransi_menit: TOLERANSI_TERLAMBAT_MENIT,
        libur_panjang_aktif: false,
        libur_panjang_mulai: null,
        libur_panjang_selesai: null,
        libur_panjang_keterangan: "",
      };
    }

    return {
      jam_masuk: (data.jam_masuk as string).slice(0, 5),    // "HH:MM:SS" → "HH:MM"
      jam_cutoff: (data.jam_cutoff as string).slice(0, 5),
      toleransi_menit: data.toleransi_menit,
      libur_panjang_aktif: data.libur_panjang_aktif ?? false,
      libur_panjang_mulai: data.libur_panjang_mulai ?? null,
      libur_panjang_selesai: data.libur_panjang_selesai ?? null,
      libur_panjang_keterangan: data.libur_panjang_keterangan ?? "",
    };
  } catch {
    // Fallback aman jika tabel belum ada (sebelum migration dijalankan)
    return {
      jam_masuk: JAM_MASUK_SEKOLAH,
      jam_cutoff: JAM_CUTOFF_ABSENSI,
      toleransi_menit: TOLERANSI_TERLAMBAT_MENIT,
      libur_panjang_aktif: false,
      libur_panjang_mulai: null,
      libur_panjang_selesai: null,
      libur_panjang_keterangan: "",
    };
  }
}

export async function upsertPengaturanSistem(
  jam_masuk: string,
  jam_cutoff: string,
  toleransi_menit: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("id")
      .maybeSingle();

    const payload = { jam_masuk, jam_cutoff, toleransi_menit, updated_at: new Date().toISOString() };

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("pengaturan_sistem")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("pengaturan_sistem")
        .insert(payload);
      if (error) throw new Error(error.message);
    }

    revalidatePath("/admin/pengaturan");
    revalidatePath("/guru");
    revalidatePath("/kepsek");
    return { success: true };
  } catch (err: any) {
    console.error("upsertPengaturanSistem error:", err);
    return { success: false, error: err.message };
  }
}

// ── Hari Libur ────────────────────────────────────────────────

export async function getHariLibur(): Promise<HariLibur[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("hari_libur")
      .select("id, tanggal, keterangan")
      .order("tanggal", { ascending: true });

    if (error) {
      console.error("getHariLibur error:", error);
      return [];
    }

    return (data ?? []) as HariLibur[];
  } catch {
    return [];
  }
}

/**
 * Cek apakah tanggal tertentu adalah hari libur.
 * Mengembalikan false jika tabel belum ada (sebelum migration) — aman untuk existing logic.
 */
export async function isHariLibur(tanggal: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("hari_libur")
      .select("id")
      .eq("tanggal", tanggal)
      .maybeSingle();

    if (error) return false;
    return data !== null;
  } catch {
    return false;
  }
}

export async function tambahHariLibur(
  tanggal: string,
  keterangan: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!tanggal || !keterangan.trim()) {
      throw new Error("Tanggal dan keterangan wajib diisi.");
    }

    const { error } = await supabaseAdmin
      .from("hari_libur")
      .insert({ tanggal, keterangan: keterangan.trim() });

    if (error) {
      if (error.code === "23505") {
        throw new Error("Tanggal tersebut sudah terdaftar sebagai hari libur.");
      }
      throw new Error(error.message);
    }

    revalidatePath("/admin/pengaturan");
    revalidatePath("/guru");
    revalidatePath("/kepsek");
    revalidatePath("/kepsek/laporan");
    return { success: true };
  } catch (err: any) {
    console.error("tambahHariLibur error:", err);
    return { success: false, error: err.message };
  }
}

export async function hapusHariLibur(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from("hari_libur")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/pengaturan");
    revalidatePath("/guru");
    revalidatePath("/kepsek");
    revalidatePath("/kepsek/laporan");
    return { success: true };
  } catch (err: any) {
    console.error("hapusHariLibur error:", err);
    return { success: false, error: err.message };
  }
}

// ── Mode Libur Panjang (System Shutdown) ──────────────────────

export async function isLiburPanjang(tanggal?: string): Promise<boolean> {
  try {
    const targetDate = tanggal || getTodayWIB();
    const { data, error } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("libur_panjang_aktif, libur_panjang_mulai, libur_panjang_selesai")
      .maybeSingle();

    if (error || !data) return false;
    if (!data.libur_panjang_aktif) return false;

    const mulai = data.libur_panjang_mulai ?? null;
    const selesai = data.libur_panjang_selesai ?? null;

    // Jika tanggal tidak diisi, berarti mode libur panjang aktif langsung (shutdown seketika)
    if (!mulai && !selesai) return true;
    if (mulai && selesai) {
      return targetDate >= mulai && targetDate <= selesai;
    }
    if (mulai && !selesai) {
      return targetDate >= mulai;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getLiburPanjangStatus(): Promise<{
  aktif: boolean;
  isTodayInLibur: boolean;
  mulai: string | null;
  selesai: string | null;
  keterangan: string | null;
}> {
  try {
    const today = getTodayWIB();
    const { data, error } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("libur_panjang_aktif, libur_panjang_mulai, libur_panjang_selesai, libur_panjang_keterangan")
      .maybeSingle();

    if (error || !data || !data.libur_panjang_aktif) {
      return { aktif: false, isTodayInLibur: false, mulai: null, selesai: null, keterangan: null };
    }

    const mulai = data.libur_panjang_mulai ?? null;
    const selesai = data.libur_panjang_selesai ?? null;

    let isTodayInLibur = false;
    if (!mulai && !selesai) {
      isTodayInLibur = true;
    } else if (mulai && selesai) {
      isTodayInLibur = today >= mulai && today <= selesai;
    } else if (mulai && !selesai) {
      isTodayInLibur = today >= mulai;
    }

    return {
      aktif: Boolean(data.libur_panjang_aktif),
      isTodayInLibur,
      mulai,
      selesai,
      keterangan: data.libur_panjang_keterangan ?? null,
    };
  } catch {
    return { aktif: false, isTodayInLibur: false, mulai: null, selesai: null, keterangan: null };
  }
}

export async function updateLiburPanjang(
  aktif: boolean,
  mulai: string | null,
  selesai: string | null,
  keterangan?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (aktif) {
      if (mulai && selesai && selesai < mulai) {
        throw new Error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      }
    }

    const { data: existing } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("id")
      .maybeSingle();

    const payload = {
      libur_panjang_aktif: aktif,
      libur_panjang_mulai: mulai || null,
      libur_panjang_selesai: selesai || null,
      libur_panjang_keterangan: keterangan?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("pengaturan_sistem")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("pengaturan_sistem")
        .insert({
          jam_masuk: JAM_MASUK_SEKOLAH,
          jam_cutoff: JAM_CUTOFF_ABSENSI,
          toleransi_menit: TOLERANSI_TERLAMBAT_MENIT,
          ...payload,
        });
      if (error) throw new Error(error.message);
    }

    revalidatePath("/admin/pengaturan");
    revalidatePath("/guru");
    revalidatePath("/kepsek");
    revalidatePath("/kepsek/laporan");
    return { success: true };
  } catch (err: any) {
    console.error("updateLiburPanjang error:", err);
    return { success: false, error: err.message };
  }
}

// ── Unified Operational / Holiday Status Resolver ─────────────

export type TipeLibur = "LIBUR_PANJANG" | "HARI_LIBUR" | "WEEKEND" | null;

export interface StatusOperasionalHariIni {
  isOperasional: boolean;
  tipeLibur: TipeLibur;
  judul: string;
  deskripsi: string;
  periode?: string | null;
  keterangan?: string | null;
}

/**
 * Single Source of Truth untuk status operasional absensi harian.
 * Mengevaluasi hierarki: Libur Panjang (Shutdown) > Hari Libur Nasional/Sekolah > Weekend.
 */
export async function getStatusOperasionalHariIni(
  tanggal?: string
): Promise<StatusOperasionalHariIni> {
  const targetDate = tanggal || getTodayWIB();

  // 1. Prioritas #1: Libur Panjang (Shutdown oleh Admin)
  const liburPanjang = await getLiburPanjangStatus();
  if (liburPanjang.aktif && liburPanjang.isTodayInLibur) {
    let periodeStr = "";
    if (liburPanjang.mulai && liburPanjang.selesai) {
      periodeStr = `${liburPanjang.mulai} s.d. ${liburPanjang.selesai}`;
    }
    return {
      isOperasional: false,
      tipeLibur: "LIBUR_PANJANG",
      judul: "Mode Libur Panjang Aktif",
      deskripsi: liburPanjang.keterangan
        ? `${liburPanjang.keterangan}. Seluruh aktivitas absensi dinonaktifkan sementara oleh Admin sekolah.`
        : "Seluruh aktivitas absensi dinonaktifkan sementara oleh Admin sekolah.",
      periode: periodeStr || null,
      keterangan: liburPanjang.keterangan || null,
    };
  }

  // 2. Prioritas #2: Hari Libur Nasional / Sekolah (dari tabel hari_libur)
  try {
    const { data: holidayData } = await supabaseAdmin
      .from("hari_libur")
      .select("keterangan")
      .eq("tanggal", targetDate)
      .maybeSingle();

    if (holidayData) {
      return {
        isOperasional: false,
        tipeLibur: "HARI_LIBUR",
        judul: "Hari Libur Nasional / Sekolah",
        deskripsi: holidayData.keterangan
          ? `Hari ini libur: ${holidayData.keterangan}. Aktivitas absensi tidak aktif.`
          : "Hari ini adalah hari libur sekolah. Aktivitas absensi tidak aktif.",
        periode: targetDate,
        keterangan: holidayData.keterangan || null,
      };
    }
  } catch (err) {
    console.error("getStatusOperasionalHariIni holiday check error:", err);
  }

  // 3. Prioritas #3: Akhir Pekan (Sabtu & Minggu)
  const isWeekend = isWeekendWIB(targetDate);
  if (isWeekend) {
    return {
      isOperasional: false,
      tipeLibur: "WEEKEND",
      judul: "Hari Libur Akhir Pekan",
      deskripsi: "Aktivitas absensi (Kehadiran & Mengajar) tidak aktif pada hari Sabtu & Minggu.",
      periode: null,
      keterangan: "Sabtu & Minggu",
    };
  }

  // 4. Hari Kerja Aktif Normal
  return {
    isOperasional: true,
    tipeLibur: null,
    judul: "Hari Kerja Aktif",
    deskripsi: "Sistem absensi beroperasi normal.",
    periode: null,
    keterangan: null,
  };
}


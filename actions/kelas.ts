"use server";

/**
 * SERVER ACTIONS — KELAS
 * Fetch data kelas dari tabel `kelas` di Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Kelas } from "@/types/schema";
import { requireAdmin } from "@/lib/session";

export async function getKelasList(): Promise<Kelas[]> {
  const { data, error } = await supabaseAdmin
    .from("kelas")
    .select("*")
    .order("nama_kelas");
  if (error) throw new Error(error.message);
  return (data ?? []) as Kelas[];
}

/** Filter kelas berdasarkan tingkat (e.g. "7" → Kelas 7A, 7B, 7C) */
export async function getKelasByTingkat(tingkat: string): Promise<Kelas[]> {
  const { data, error } = await supabaseAdmin
    .from("kelas")
    .select("*")
    .ilike("nama_kelas", `Kelas ${tingkat}%`)
    .order("nama_kelas");
  if (error) throw new Error(error.message);
  return (data ?? []) as Kelas[];
}

export async function getKelasById(id: string): Promise<Kelas | null> {
  const { data, error } = await supabaseAdmin
    .from("kelas")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Kelas;
}

export async function createKelas(payload: { nama_kelas: string }): Promise<{ success: boolean; data?: Kelas; error?: string }> {
  try {
    await requireAdmin();
    const kode_qr = crypto.randomUUID();
    
    const { data, error } = await supabaseAdmin
      .from("kelas")
      .insert([{ ...payload, kode_qr }])
      .select("*")
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateKelas(id: string, payload: { nama_kelas: string }): Promise<{ success: boolean; data?: Kelas; error?: string }> {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("kelas")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateLokasiKelas(
  id: string,
  payload: { latitude: number; longitude: number; radius_meter?: number }
): Promise<{ success: boolean; data?: Kelas; error?: string }> {
  try {
    await requireAdmin();

    const { latitude, longitude, radius_meter } = payload;

    if (typeof latitude !== "number" || isNaN(latitude) || latitude < -90 || latitude > 90) {
      return { success: false, error: "Latitude tidak valid (-90 hingga 90)." };
    }

    if (typeof longitude !== "number" || isNaN(longitude) || longitude < -180 || longitude > 180) {
      return { success: false, error: "Longitude tidak valid (-180 hingga 180)." };
    }

    const radius = radius_meter !== undefined ? Number(radius_meter) : 5;
    if (isNaN(radius) || radius <= 0 || radius > 500) {
      return { success: false, error: "Radius toleransi harus berupa angka positif (1 - 500 meter)." };
    }

    const { data, error } = await supabaseAdmin
      .from("kelas")
      .update({
        latitude,
        longitude,
        radius_meter: radius,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return { success: true, data: data as Kelas };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function checkKelasRelations(
  id?: string
): Promise<{ hasRelations: boolean; details: string[]; warningMessage?: string }> {
  try {
    let jadwalQuery = supabaseAdmin.from("jadwal").select("id", { count: "exact", head: true });

    if (id) {
      jadwalQuery = jadwalQuery.eq("kelas_id", id);
    } else {
      jadwalQuery = jadwalQuery.not("kelas_id", "is", null);
    }

    const { count: jadwalCount } = await jadwalQuery;
    const details: string[] = [];

    if ((jadwalCount ?? 0) > 0) {
      details.push(`${jadwalCount} jadwal mata pelajaran KBM`);
    }

    return {
      hasRelations: details.length > 0,
      details,
      warningMessage:
        details.length > 0
          ? `Ruang kelas masih digunakan pada ${details.join(", ")}.`
          : undefined,
    };
  } catch (err: any) {
    console.error("checkKelasRelations Error:", err);
    return { hasRelations: false, details: [] };
  }
}

export async function deleteKelas(
  id: string
): Promise<{ success: boolean; error?: string; isRelationError?: boolean }> {
  try {
    await requireAdmin();
    const rel = await checkKelasRelations(id);
    if (rel.hasRelations) {
      return {
        success: false,
        isRelationError: true,
        error: `Ruang kelas ini tidak dapat dihapus karena masih digunakan pada ${rel.details.join(" serta ")}. Harap hapus atau ubah jadwal terkait terlebih dahulu.`,
      };
    }

    const { error } = await supabaseAdmin.from("kelas").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          isRelationError: true,
          error: "Kelas ini masih digunakan pada jadwal pelajaran.",
        };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAllKelas(
  forceCascade = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!forceCascade) {
      const rel = await checkKelasRelations();
      if (rel.hasRelations) {
        return {
          success: false,
          error: "Terdapat data kelas yang masih memiliki jadwal pelajaran aktif.",
        };
      }
      const { error } = await supabaseAdmin.from("kelas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return { success: true };
    }

    // Force Cascade:
    // 1. Ambil seluruh id jadwal yang terkait kelas
    const { data: jadwalList } = await supabaseAdmin.from("jadwal").select("id");
    const jadwalIds = jadwalList?.map((j) => j.id) || [];

    if (jadwalIds.length > 0) {
      // Hapus absensi mengajar terkait jadwal tersebut
      await supabaseAdmin.from("absensi_mengajar").delete().in("jadwal_id", jadwalIds);
      // Hapus jadwal
      await supabaseAdmin.from("jadwal").delete().in("id", jadwalIds);
    }

    // Hapus seluruh kelas
    const { error } = await supabaseAdmin.from("kelas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("deleteAllKelas Error:", err);
    return { success: false, error: err.message };
  }
}


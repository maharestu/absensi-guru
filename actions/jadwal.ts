"use server";

/**
 * SERVER ACTIONS — JADWAL
 * Fetch and manage jadwal mengajar dari Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Jadwal, JadwalWithDetail } from "@/types/schema";
import { requireAdmin } from "@/lib/session";

export async function getJadwalList(): Promise<JadwalWithDetail[]> {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `)
    .order("hari")
    .order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal list:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function getJadwalById(id: string): Promise<JadwalWithDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching jadwal by id:", error);
    return null;
  }

  return (data as unknown as JadwalWithDetail) ?? null;
}

export async function getJadwalByGuruAndHari(
  guruId?: string,
  kelasId?: string,
  hari?: string
): Promise<JadwalWithDetail[]> {
  const VALID_HARI = ["senin", "selasa", "rabu", "kamis", "jumat"];
  const { getDevTestingConfigServer } = await import("@/lib/testing-mode");
  const testConfig = await getDevTestingConfigServer();

  let targetHari = hari ? hari.toLowerCase() : undefined;

  // Jika mode testing aktif dan hari ini akhir pekan, simulasikan hari yang dipilih di mode testing
  if (testConfig.isActive && targetHari && !VALID_HARI.includes(targetHari)) {
    targetHari = (testConfig.simDay || "senin").toLowerCase();
  }

  if (targetHari && !VALID_HARI.includes(targetHari)) {
    return [];
  }

  let query = supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `);

  if (guruId) query = query.eq("guru_id", guruId);
  if (kelasId) query = query.eq("kelas_id", kelasId);
  if (targetHari) query = query.eq("hari", targetHari);

  const { data, error } = await query.order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function createJadwal(input: Omit<Jadwal, "id" | "created_at">) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateJadwal(id: string, input: Partial<Jadwal>) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function checkJadwalRelations(
  id?: string
): Promise<{ hasRelations: boolean; details: string[]; warningMessage?: string }> {
  try {
    let absensiQuery = supabaseAdmin.from("absensi_mengajar").select("id", { count: "exact", head: true });

    if (id) {
      absensiQuery = absensiQuery.eq("jadwal_id", id);
    } else {
      absensiQuery = absensiQuery.not("jadwal_id", "is", null);
    }

    const { count } = await absensiQuery;
    const details: string[] = [];

    if ((count ?? 0) > 0) {
      details.push(`${count} catatan riwayat presensi mengajar guru`);
    }

    return {
      hasRelations: details.length > 0,
      details,
      warningMessage:
        details.length > 0
          ? `Jadwal masih terhubung dengan ${details.join(", ")}.`
          : undefined,
    };
  } catch (err: any) {
    console.error("checkJadwalRelations Error:", err);
    return { hasRelations: false, details: [] };
  }
}

export async function deleteJadwal(
  id: string
): Promise<{ success: boolean; error?: string; isRelationError?: boolean }> {
  try {
    await requireAdmin();
    const rel = await checkJadwalRelations(id);
    if (rel.hasRelations) {
      return {
        success: false,
        isRelationError: true,
        error: `Jadwal ini tidak dapat dihapus karena sudah memiliki ${rel.details.join(" serta ")}. Harap hapus catatan absensi mengajar terkait terlebih dahulu.`,
      };
    }

    const { error } = await supabaseAdmin.from("jadwal").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          isRelationError: true,
          error: "Jadwal ini masih memiliki riwayat presensi mengajar.",
        };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAllJadwal(
  forceCascade = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!forceCascade) {
      const rel = await checkJadwalRelations();
      if (rel.hasRelations) {
        return {
          success: false,
          error: "Terdapat jadwal yang sudah memiliki riwayat absensi mengajar.",
        };
      }
      const { error } = await supabaseAdmin.from("jadwal").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return { success: true };
    }

    // Force Cascade:
    // 1. Hapus riwayat absensi mengajar
    await supabaseAdmin.from("absensi_mengajar").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Hapus seluruh jadwal
    const { error } = await supabaseAdmin.from("jadwal").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("deleteAllJadwal Error:", err);
    return { success: false, error: err.message };
  }
}


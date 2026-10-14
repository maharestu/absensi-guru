"use server";

/**
 * SERVER ACTIONS — GURU
 * CRUD untuk tabel `guru` di Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Guru } from "@/types/schema";
import { requireAdmin } from "@/lib/session";

export async function getGuruList(): Promise<Guru[]> {
  const { data, error } = await supabaseAdmin
    .from("guru")
    .select("*")
    .order("nama");
  if (error) throw new Error(error.message);
  return (data ?? []) as Guru[];
}

export async function getGuruById(id: string): Promise<Guru | null> {
  const { data, error } = await supabaseAdmin
    .from("guru")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Guru;
}

export async function createGuru(
  input: Omit<Guru, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("guru").insert(input);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateGuru(
  id: string,
  input: Partial<Omit<Guru, "id" | "created_at">>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("guru")
      .update(input)
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function checkGuruRelations(
  id?: string
): Promise<{ hasRelations: boolean; details: string[]; warningMessage?: string }> {
  try {
    let akunQuery = supabaseAdmin.from("akun").select("id", { count: "exact", head: true });
    let jadwalQuery = supabaseAdmin.from("jadwal").select("id", { count: "exact", head: true });
    let absensiQuery = supabaseAdmin.from("absensi_masuk").select("id", { count: "exact", head: true });

    if (id) {
      akunQuery = akunQuery.eq("guru_id", id);
      jadwalQuery = jadwalQuery.eq("guru_id", id);
      absensiQuery = absensiQuery.eq("guru_id", id);
    } else {
      akunQuery = akunQuery.not("guru_id", "is", null);
    }

    const [akunRes, jadwalRes, absensiRes] = await Promise.all([
      akunQuery,
      jadwalQuery,
      absensiQuery,
    ]);

    const details: string[] = [];
    if ((akunRes.count ?? 0) > 0) {
      details.push(`${akunRes.count} akun login pegawai`);
    }
    if ((jadwalRes.count ?? 0) > 0) {
      details.push(`${jadwalRes.count} jadwal mengajar aktif`);
    }
    if ((absensiRes.count ?? 0) > 0) {
      details.push(`${absensiRes.count} catatan riwayat presensi & bukti foto`);
    }

    return {
      hasRelations: details.length > 0,
      details,
      warningMessage:
        details.length > 0
          ? `Data guru masih terhubung dengan: ${details.join(", ")}.`
          : undefined,
    };
  } catch (err: any) {
    console.error("checkGuruRelations Error:", err);
    return { hasRelations: false, details: [] };
  }
}

export async function deleteGuru(
  id: string
): Promise<{ success: boolean; error?: string; isRelationError?: boolean }> {
  try {
    await requireAdmin();

    // Pre-check relasi foreign key
    const rel = await checkGuruRelations(id);
    if (rel.hasRelations) {
      return {
        success: false,
        isRelationError: true,
        error: `Guru ini tidak dapat dihapus karena masih memiliki ${rel.details.join(" serta ")}. Harap hapus atau ubah data terkait tersebut terlebih dahulu.`,
      };
    }

    const { error } = await supabaseAdmin.from("guru").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          isRelationError: true,
          error: "Guru ini masih memiliki data terkait (akun/jadwal/absensi).",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAllGuru(
  forceCascade = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!forceCascade) {
      const rel = await checkGuruRelations();
      if (rel.hasRelations) {
        return {
          success: false,
          error: "Terdapat data guru yang masih memiliki relasi aktif.",
        };
      }
      const { error } = await supabaseAdmin.from("guru").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return { success: true };
    }

    // Force Cascade: Bersihkan berurutan
    // 1. Ambil seluruh id jadwal yang terkait dengan guru
    const { data: jadwalList } = await supabaseAdmin.from("jadwal").select("id");
    const jadwalIds = jadwalList?.map((j) => j.id) || [];

    if (jadwalIds.length > 0) {
      // Hapus absensi mengajar
      await supabaseAdmin.from("absensi_mengajar").delete().in("jadwal_id", jadwalIds);
    }

    // 2. Hapus seluruh absensi masuk
    await supabaseAdmin.from("absensi_masuk").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 3. Hapus seluruh jadwal
    await supabaseAdmin.from("jadwal").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 4. Hapus akun yang punya guru_id (role guru)
    await supabaseAdmin.from("akun").delete().not("guru_id", "is", null);

    // 5. Hapus seluruh guru
    const { error: guruErr } = await supabaseAdmin
      .from("guru")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (guruErr) throw guruErr;

    return { success: true };
  } catch (err: any) {
    console.error("deleteAllGuru Error:", err);
    return { success: false, error: err.message };
  }
}


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
    .select("*, akun(role)")
    .order("nama");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    let linked_role = null;
    if (row.akun) {
      if (Array.isArray(row.akun) && row.akun.length > 0) {
        linked_role = row.akun[0].role;
      } else if (typeof row.akun === "object" && row.akun.role) {
        linked_role = row.akun.role;
      }
    }
    const { akun, ...rest } = row;
    return {
      ...rest,
      linked_role,
    };
  }) as Guru[];
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
  input: Omit<Guru, "id" | "created_at" | "linked_role">
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const { linked_role, ...dataToInsert } = input as any;
    const { error } = await supabaseAdmin.from("guru").insert(dataToInsert);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateGuru(
  id: string,
  input: Partial<Omit<Guru, "id" | "created_at" | "linked_role">>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const { linked_role, ...dataToUpdate } = input as any;
    const { error } = await supabaseAdmin
      .from("guru")
      .update(dataToUpdate)
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
      // Ambil daftar guru terlindungi (admin & kepala_sekolah) agar tidak dihitung sebagai relasi penghalang
      const { data: protectedAkuns } = await supabaseAdmin
        .from("akun")
        .select("guru_id")
        .in("role", ["admin", "kepala_sekolah"]);
      const protectedIds = (protectedAkuns || []).map(a => a.guru_id).filter(Boolean) as string[];

      akunQuery = akunQuery.eq("role", "guru");
      if (protectedIds.length > 0) {
        jadwalQuery = jadwalQuery.not("guru_id", "in", `(${protectedIds.join(",")})`);
        absensiQuery = absensiQuery.not("guru_id", "in", `(${protectedIds.join(",")})`);
      }
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
  id: string,
  forceCascade = false
): Promise<{ success: boolean; error?: string; isRelationError?: boolean }> {
  try {
    await requireAdmin();

    // Proteksi: Jangan izinkan menghapus akun dengan role admin atau kepala sekolah
    const { data: targetAkun } = await supabaseAdmin
      .from("akun")
      .select("id, role")
      .eq("guru_id", id);
    const isProtected = targetAkun?.some(
      (a) => a.role === "admin" || a.role === "kepala_sekolah"
    );
    if (isProtected) {
      return {
        success: false,
        error: "Akun Administrator dan Kepala Sekolah dilindungi oleh sistem dan tidak dapat dihapus dari halaman Guru.",
      };
    }

    if (!forceCascade) {
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
    }

    // Force Cascade untuk guru biasa spesifik ini:
    // 1. Ambil seluruh id jadwal yang terkait dengan guru ini
    const { data: jadwalList } = await supabaseAdmin
      .from("jadwal")
      .select("id")
      .eq("guru_id", id);
    const jadwalIds = jadwalList?.map((j) => j.id) || [];

    if (jadwalIds.length > 0) {
      // Hapus absensi mengajar untuk jadwal-jadwal tersebut
      await supabaseAdmin
        .from("absensi_mengajar")
        .delete()
        .in("jadwal_id", jadwalIds);
    }

    // 2. Hapus seluruh absensi masuk milik guru ini
    await supabaseAdmin.from("absensi_masuk").delete().eq("guru_id", id);

    // 3. Hapus seluruh jadwal milik guru ini
    await supabaseAdmin.from("jadwal").delete().eq("guru_id", id);

    // 4. Hapus akun login role guru yang terhubung ke guru ini
    await supabaseAdmin
      .from("akun")
      .delete()
      .eq("guru_id", id)
      .eq("role", "guru");

    // 5. Hapus data guru
    const { error: guruErr } = await supabaseAdmin
      .from("guru")
      .delete()
      .eq("id", id);

    if (guruErr) throw guruErr;

    return { success: true };
  } catch (err: any) {
    console.error("deleteGuru Error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteAllGuru(
  forceCascade = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin();

    // 1. Ambil seluruh ID guru yang terkait dengan role 'admin' atau 'kepala_sekolah' (TERLINDUNGI)
    const { data: protectedAkuns } = await supabaseAdmin
      .from("akun")
      .select("guru_id, role")
      .in("role", ["admin", "kepala_sekolah"]);

    const protectedGuruIds = new Set<string>();
    if (session.guru_id) protectedGuruIds.add(session.guru_id);
    protectedAkuns?.forEach((a) => {
      if (a.guru_id) protectedGuruIds.add(a.guru_id);
    });

    // 2. Kumpulkan daftar ID guru yang BOLEH dihapus (guru biasa non-admin/kepsek)
    const { data: allGurus, error: errFetchAll } = await supabaseAdmin
      .from("guru")
      .select("id");
    if (errFetchAll) throw errFetchAll;

    const guruIdsToDelete = (allGurus || [])
      .map((g) => g.id)
      .filter((id) => !protectedGuruIds.has(id));

    if (guruIdsToDelete.length === 0) {
      return { success: true };
    }

    if (!forceCascade) {
      const rel = await checkGuruRelations();
      if (rel.hasRelations) {
        return {
          success: false,
          error: "Terdapat data guru yang masih memiliki relasi aktif.",
        };
      }
      const { error } = await supabaseAdmin
        .from("guru")
        .delete()
        .in("id", guruIdsToDelete);
      if (error) throw error;
      return { success: true };
    }

    // Force Cascade: Bersihkan berurutan HANYA untuk guru biasa
    // 1. Ambil jadwal milik guru-guru yang akan dihapus
    const { data: jadwalList } = await supabaseAdmin
      .from("jadwal")
      .select("id")
      .in("guru_id", guruIdsToDelete);
    const jadwalIds = jadwalList?.map((j) => j.id) || [];

    if (jadwalIds.length > 0) {
      // Hapus absensi mengajar terkait jadwal guru-guru ini
      await supabaseAdmin
        .from("absensi_mengajar")
        .delete()
        .in("jadwal_id", jadwalIds);
      // Hapus jadwal
      await supabaseAdmin
        .from("jadwal")
        .delete()
        .in("id", jadwalIds);
    }

    // 2. Hapus seluruh absensi masuk guru-guru yang akan dihapus
    await supabaseAdmin
      .from("absensi_masuk")
      .delete()
      .in("guru_id", guruIdsToDelete);

    // 3. Hapus akun HANYA untuk role 'guru' yang terkait dengan guru-guru ini
    await supabaseAdmin
      .from("akun")
      .delete()
      .eq("role", "guru")
      .in("guru_id", guruIdsToDelete);

    // 4. Hapus data guru biasa
    const { error: guruErr } = await supabaseAdmin
      .from("guru")
      .delete()
      .in("id", guruIdsToDelete);

    if (guruErr) throw guruErr;

    return { success: true };
  } catch (err: any) {
    console.error("deleteAllGuru Error:", err);
    return { success: false, error: err.message };
  }
}


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
    if (id) {
      // Cek apakah guru ini terhubung dengan akun admin
      const { data: adminAkun } = await supabaseAdmin
        .from("akun")
        .select("id")
        .eq("guru_id", id)
        .eq("role", "admin")
        .maybeSingle();

      const [akunRes, jadwalRes, absensiRes] = await Promise.all([
        supabaseAdmin.from("akun").select("id", { count: "exact", head: true }).eq("guru_id", id),
        supabaseAdmin.from("jadwal").select("id", { count: "exact", head: true }).eq("guru_id", id),
        supabaseAdmin.from("absensi_masuk").select("id", { count: "exact", head: true }).eq("guru_id", id),
      ]);

      const details: string[] = [];
      if (adminAkun) {
        details.push("akun login berole Administrator (terproteksi)");
      } else if ((akunRes.count ?? 0) > 0) {
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
        warningMessage: adminAkun
          ? "Guru ini terhubung dengan akun Administrator dan diproteksi dari penghapusan."
          : details.length > 0
          ? `Data guru masih terhubung dengan: ${details.join(", ")}.`
          : undefined,
      };
    }

    // Global audit (Hapus Semua)
    // 1. Ambil daftar guru_id yang memiliki akun login berole admin
    const { data: adminGuruData } = await supabaseAdmin
      .from("akun")
      .select("guru_id")
      .eq("role", "admin")
      .not("guru_id", "is", null);

    const protectedGuruIds = (adminGuruData ?? [])
      .map((a) => a.guru_id)
      .filter((gid): gid is string => Boolean(gid));

    let akunQuery: any = supabaseAdmin
      .from("akun")
      .select("id", { count: "exact", head: true })
      .not("guru_id", "is", null)
      .neq("role", "admin");

    let jadwalQuery: any = supabaseAdmin
      .from("jadwal")
      .select("id", { count: "exact", head: true });

    let absensiQuery: any = supabaseAdmin
      .from("absensi_masuk")
      .select("id", { count: "exact", head: true });

    if (protectedGuruIds.length > 0) {
      const inList = `(${protectedGuruIds.join(",")})`;
      jadwalQuery = jadwalQuery.not("guru_id", "in", inList);
      absensiQuery = absensiQuery.not("guru_id", "in", inList);
      akunQuery = akunQuery.not("guru_id", "in", inList);
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

    let warningMessage: string | undefined;
    if (protectedGuruIds.length > 0) {
      warningMessage = `${protectedGuruIds.length} data guru terhubung dengan akun Administrator dan akan diproteksi (tidak akan ikut terhapus).`;
    } else if (details.length > 0) {
      warningMessage = `Data guru masih terhubung dengan: ${details.join(", ")}.`;
    }

    return {
      hasRelations: details.length > 0,
      details,
      warningMessage,
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

    // Cek apakah guru ini terhubung dengan akun admin
    const { data: adminAkun } = await supabaseAdmin
      .from("akun")
      .select("id")
      .eq("guru_id", id)
      .eq("role", "admin")
      .maybeSingle();

    if (adminAkun) {
      return {
        success: false,
        isRelationError: true,
        error: "Guru ini terhubung dengan akun Administrator dan diproteksi dari penghapusan.",
      };
    }

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

    // Ambil daftar guru_id yang memiliki akun login berole admin (diproteksi)
    const { data: adminGuruData, error: adminErr } = await supabaseAdmin
      .from("akun")
      .select("guru_id")
      .eq("role", "admin")
      .not("guru_id", "is", null);

    if (adminErr) throw adminErr;

    const protectedGuruIds = (adminGuruData ?? [])
      .map((a) => a.guru_id)
      .filter((gid): gid is string => Boolean(gid));

    if (!forceCascade) {
      const rel = await checkGuruRelations();
      if (rel.hasRelations) {
        return {
          success: false,
          error: "Terdapat data guru yang masih memiliki relasi aktif.",
        };
      }

      let deleteQuery = supabaseAdmin
        .from("guru")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (protectedGuruIds.length > 0) {
        deleteQuery = deleteQuery.not("id", "in", `(${protectedGuruIds.join(",")})`);
      }

      const { error } = await deleteQuery;
      if (error) throw error;
      return { success: true };
    }

    // Force Cascade: Bersihkan data hanya untuk guru non-admin
    // 1. Hapus absensi mengajar untuk jadwal yang terkait dengan guru non-admin
    const { count: totalAbsensiMengajar } = await supabaseAdmin
      .from("absensi_mengajar")
      .select("id", { count: "exact", head: true });

    if ((totalAbsensiMengajar ?? 0) > 0) {
      if (protectedGuruIds.length === 0) {
        const { error: absMengajarErr } = await supabaseAdmin
          .from("absensi_mengajar")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (absMengajarErr) throw absMengajarErr;
      } else {
        const { data: absensiMengajarList, error: absMengajarErr } = await supabaseAdmin
          .from("absensi_mengajar")
          .select("id, jadwal!inner(guru_id)")
          .not("jadwal.guru_id", "in", `(${protectedGuruIds.join(",")})`);
        if (absMengajarErr) throw absMengajarErr;

        const absensiMengajarIds = absensiMengajarList?.map((a: any) => a.id) || [];
        if (absensiMengajarIds.length > 0) {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < absensiMengajarIds.length; i += CHUNK_SIZE) {
            const chunk = absensiMengajarIds.slice(i, i + CHUNK_SIZE);
            const { error: delErr } = await supabaseAdmin
              .from("absensi_mengajar")
              .delete()
              .in("id", chunk);
            if (delErr) throw delErr;
          }
        }
      }
    }

    // 2. Hapus absensi masuk milik guru non-admin
    let absensiMasukQuery = supabaseAdmin
      .from("absensi_masuk")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (protectedGuruIds.length > 0) {
      absensiMasukQuery = absensiMasukQuery.not("guru_id", "in", `(${protectedGuruIds.join(",")})`);
    }
    const { error: absensiMasukErr } = await absensiMasukQuery;
    if (absensiMasukErr) throw absensiMasukErr;

    // 3. Hapus jadwal milik guru non-admin
    let deleteJadwalQuery = supabaseAdmin
      .from("jadwal")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (protectedGuruIds.length > 0) {
      deleteJadwalQuery = deleteJadwalQuery.not("guru_id", "in", `(${protectedGuruIds.join(",")})`);
    }
    const { error: deleteJadwalErr } = await deleteJadwalQuery;
    if (deleteJadwalErr) throw deleteJadwalErr;

    // 4. Hapus akun guru non-admin (kecualikan role admin dan guru yang diproteksi)
    let deleteAkunQuery = supabaseAdmin
      .from("akun")
      .delete()
      .not("guru_id", "is", null)
      .neq("role", "admin");
    if (protectedGuruIds.length > 0) {
      deleteAkunQuery = deleteAkunQuery.not("guru_id", "in", `(${protectedGuruIds.join(",")})`);
    }
    const { error: deleteAkunErr } = await deleteAkunQuery;
    if (deleteAkunErr) throw deleteAkunErr;

    // 5. Hapus seluruh guru non-admin
    let deleteGuruQuery = supabaseAdmin
      .from("guru")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (protectedGuruIds.length > 0) {
      deleteGuruQuery = deleteGuruQuery.not("id", "in", `(${protectedGuruIds.join(",")})`);
    }

    const { error: guruErr } = await deleteGuruQuery;
    if (guruErr) throw guruErr;

    return { success: true };
  } catch (err: any) {
    console.error("deleteAllGuru Error:", err);
    return { success: false, error: err.message };
  }
}


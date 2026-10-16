"use server";

/**
 * SERVER ACTIONS — AKUN
 * CRUD untuk tabel `akun` di Supabase.
 * Pembuatan akun baru otomatis meng-hash password via bcrypt.
 */

import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { Akun } from "@/types/schema";
import { AdminAkunItem } from "@/types/admin";
import { requireAdmin } from "@/lib/session";

const SALT_ROUNDS = 10;

/** Ambil semua akun (join nama NIP dari tabel guru) */
export async function getAkunList(): Promise<AdminAkunItem[]> {
  const { data, error } = await supabaseAdmin
    .from("akun")
    .select("id, username, nama, role, status, created_at, guru_id, guru(nip)")
    .order("nama");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    nama: row.nama,
    // @ts-expect-error — supabase join returns nested object
    nip: row.guru?.nip ?? undefined,
    role: row.role as AdminAkunItem["role"],
    status: row.status as AdminAkunItem["status"],
    terakhir_dilihat: "-",
    created_at: row.created_at,
  }));
}

/** Buat akun baru — password otomatis di-hash */
export async function createAkun(input: {
  username: string;
  password: string;
  nama: string;
  role: Akun["role"];
  guru_id?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const { error } = await supabaseAdmin.from("akun").insert({
      username: input.username,
      password_hash,
      nama: input.nama,
      role: input.role,
      status: "aktif",
      guru_id: input.guru_id ?? null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Update data akun (password opsional — jika diisi akan di-hash ulang) */
export async function updateAkun(
  id: string,
  input: {
    username?: string;
    nama?: string;
    role?: Akun["role"];
    status?: Akun["status"];
    password?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.username) updateData.username = input.username;
    if (input.nama) updateData.nama = input.nama;
    if (input.role) updateData.role = input.role;
    if (input.status) updateData.status = input.status;
    if (input.password) {
      updateData.password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
    }

    const { error } = await supabaseAdmin
      .from("akun")
      .update(updateData)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Audit relasi / proteksi akun */
export async function checkAkunRelations(
  currentUserId?: string
): Promise<{ hasRelations: boolean; details: string[]; warningMessage?: string }> {
  try {
    await requireAdmin();
    const details: string[] = [
      "Seluruh akun dengan role Administrator akan tetap diproteksi dan TIDAK akan ikut terhapus.",
    ];

    return {
      hasRelations: false, // Akun tidak memblokir hapus karena seluruh akun admin diproteksi otomatis
      details,
      warningMessage: "Seluruh akun dengan role Administrator diproteksi dan tidak akan ikut terhapus.",
    };
  } catch (err: any) {
    return { hasRelations: false, details: [] };
  }
}

/** Hapus akun */
export async function deleteAkun(
  id: string,
  currentUserId?: string
): Promise<{ success: boolean; error?: string; isRelationError?: boolean }> {
  try {
    const session = await requireAdmin();
    const activeUserId = currentUserId || session.id;

    if (activeUserId && id === activeUserId) {
      return {
        success: false,
        isRelationError: true,
        error: "Anda tidak dapat menghapus akun Administrator yang sedang aktif digunakan saat ini.",
      };
    }

    const { error } = await supabaseAdmin
      .from("akun")
      .delete()
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Hapus semua akun (memproteksi semua akun dengan role admin) */
export async function deleteAllAkun(
  currentUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAdmin();
    const activeUserId = currentUserId || session.id;

    let query = supabaseAdmin
      .from("akun")
      .delete()
      .neq("role", "admin");

    if (activeUserId) {
      query = query.neq("id", activeUserId);
    }

    const { error } = await query;
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("deleteAllAkun Error:", err);
    return { success: false, error: err.message };
  }
}


"use server";

/**
 * SERVER ACTIONS - AUTHENTICATION
 *
 * Menangani login dengan query ke tabel `akun` di Supabase.
 * Field pertama bisa berupa USERNAME atau NIP guru — keduanya diterima.
 * Password diverifikasi menggunakan bcrypt.
 */

import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { Akun } from "@/types/schema";
import { createSession, destroySession, getSession } from "@/lib/session";

export type LoginResult =
  | { success: true; user: Omit<Akun, "password_hash"> }
  | { success: false; error: string };

export async function loginAction(
  usernameOrNip: string,
  password: string
): Promise<LoginResult> {
  if (!usernameOrNip || !password) {
    return { success: false, error: "Username/NIP dan password wajib diisi." };
  }

  const identifier = usernameOrNip.trim();

  // Coba login via username dulu
  let { data, error } = await supabaseAdmin
    .from("akun")
    .select("*")
    .eq("username", identifier)
    .eq("status", "aktif")
    .maybeSingle();

  // Jika tidak ketemu via username, coba via NIP (join ke tabel guru)
  if (!data) {
    const { data: guruData, error: guruError } = await supabaseAdmin
      .from("guru")
      .select("id")
      .eq("nip", identifier)
      .eq("status", "aktif")
      .maybeSingle();

    if (!guruError && guruData) {
      // Temukan akun yang berelasi dengan guru ini
      const { data: akunData, error: akunError } = await supabaseAdmin
        .from("akun")
        .select("*")
        .eq("guru_id", guruData.id)
        .eq("status", "aktif")
        .maybeSingle();

      if (!akunError && akunData) {
        data = akunData;
        error = null;
      }
    }
  }

  if (error || !data) {
    return { success: false, error: "Username/NIP atau password salah." };
  }

  // Verifikasi password dengan bcrypt
  const passwordMatch = await bcrypt.compare(password, data.password_hash);
  if (!passwordMatch) {
    return { success: false, error: "Username/NIP atau password salah." };
  }

  // Fetch NIP dari tabel guru jika akun memiliki guru_id
  let nip: string | null = null;
  if (data.guru_id) {
    const { data: guruDetail } = await supabaseAdmin
      .from("guru")
      .select("nip")
      .eq("id", data.guru_id)
      .single();
    nip = guruDetail?.nip ?? null;
  }

  // Strip password_hash sebelum dikirim ke client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userSafe } = data;
  const finalUser = { ...userSafe, nip } as Omit<Akun, "password_hash">;

  // Set HTTP-Only Cookie Session (1 hari)
  await createSession(finalUser);

  return {
    success: true,
    user: finalUser,
  };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}

/**
 * Mengambil informasi user aktif dari server session cookie
 */
export async function getCurrentUserAction(): Promise<Omit<Akun, "password_hash"> | null> {
  try {
    const session = await getSession();
    if (!session) return null;

    const { data, error } = await supabaseAdmin
      .from("akun")
      .select("id, username, role, nama, status, guru_id, created_at")
      .eq("id", session.id)
      .eq("status", "aktif")
      .maybeSingle();

    if (error || !data) {
      await destroySession();
      return null;
    }

    return {
      ...data,
      nip: session.nip ?? null,
    } as Omit<Akun, "password_hash">;
  } catch (err) {
    console.error("getCurrentUserAction Error:", err);
    return null;
  }
}

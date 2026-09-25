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
  // Berlaku untuk semua role: guru, kepala_sekolah, maupun admin
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
  return {
    success: true,
    user: { ...userSafe, nip } as Omit<Akun, "password_hash">,
  };
}

export async function logoutAction(): Promise<void> {
  // Pada implementasi session-based, tambahkan invalidasi session di sini
  // Untuk sekarang, logout ditangani di sisi client (clear state + localStorage)
}

"use server";

/**
 * SERVER ACTIONS — PENGATURAN KEPALA SEKOLAH
 * 
 * Menyediakan endpoint aman bagi peran Kepala Sekolah untuk:
 * 1. Mengambil data identitas profil akun kepala sekolah yang sedang login
 * 2. Mengubah kata sandi (password) akun kepala sekolah secara aman dengan bcrypt
 */

import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/session";
import { handleActionError } from "@/lib/error-handler";

const SALT_ROUNDS = 10;

export interface ProfilKepsekData {
  id: string;
  nama: string;
  username: string;
  role: string;
  nip?: string | null;
}

export async function getProfilKepsekData(): Promise<{
  success: boolean;
  data?: ProfilKepsekData;
  error?: string;
}> {
  try {
    const session = await requireAuth(["kepala_sekolah"]);

    const { data: akun, error } = await supabaseAdmin
      .from("akun")
      .select("id, nama, username, role, guru_id, guru:guru_id(nip)")
      .eq("id", session.id)
      .eq("status", "aktif")
      .single();

    if (error || !akun) {
      return { success: false, error: "Data akun Kepala Sekolah tidak ditemukan atau nonaktif." };
    }

    const guruObj = Array.isArray(akun.guru) ? akun.guru[0] : akun.guru;

    return {
      success: true,
      data: {
        id: akun.id,
        nama: akun.nama || session.nama,
        username: akun.username || session.username,
        role: "Kepala Sekolah",
        nip: (guruObj as any)?.nip || session.nip || null,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: handleActionError(err, "getProfilKepsekData", "Gagal memuat profil Kepala Sekolah."),
    };
  }
}

export async function gantiPasswordKepsekAction(input: {
  passwordLama: string;
  passwordBaru: string;
  konfirmasiPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await requireAuth(["kepala_sekolah"]);

    const { passwordLama, passwordBaru, konfirmasiPassword } = input;

    // 1. Validasi Keberadaan Input
    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      return { success: false, error: "Semua kolom kata sandi wajib diisi." };
    }

    // 2. Validasi Panjang Karakter Password Baru
    if (passwordBaru.length < 6) {
      return { success: false, error: "Kata sandi baru minimal harus 6 karakter." };
    }

    // 3. Validasi Kesesuaian Konfirmasi
    if (passwordBaru !== konfirmasiPassword) {
      return { success: false, error: "Konfirmasi kata sandi baru tidak cocok." };
    }

    // 4. Ambil Akun dan Verifikasi Password Lama
    const { data: akun, error: akunError } = await supabaseAdmin
      .from("akun")
      .select("id, password_hash")
      .eq("id", session.id)
      .eq("status", "aktif")
      .eq("role", "kepala_sekolah")
      .single();

    if (akunError || !akun) {
      return { success: false, error: "Akun Kepala Sekolah tidak ditemukan atau sedang nonaktif." };
    }

    const isMatch = await bcrypt.compare(passwordLama, akun.password_hash);
    if (!isMatch) {
      return { success: false, error: "Kata sandi saat ini (lama) salah." };
    }

    // 5. Hash Password Baru dan Simpan
    const password_hash = await bcrypt.hash(passwordBaru, SALT_ROUNDS);
    const { error: updateError } = await supabaseAdmin
      .from("akun")
      .update({ password_hash })
      .eq("id", session.id);

    if (updateError) {
      console.error("Gagal update password kepala sekolah:", updateError);
      return { success: false, error: "Gagal menyimpan kata sandi baru ke database." };
    }

    return {
      success: true,
      message: "Kata sandi akun Kepala Sekolah berhasil diperbarui.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: handleActionError(err, "gantiPasswordKepsekAction", "Terjadi kesalahan internal pada server."),
    };
  }
}


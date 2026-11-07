"use server";

/**
 * SERVER ACTIONS — PENGATURAN GURU
 * 
 * Menyediakan endpoint aman bagi peran guru untuk:
 * 1. Mengambil data identitas profil guru & akun terhubung
 * 2. Mengubah kata sandi (password) akun guru secara aman dengan bcrypt
 */

import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { handleActionError } from "@/lib/error-handler";

export interface ProfilGuruData {
  id: string;
  nama: string;
  nip: string;
  username: string;
  jabatan?: string | null;
  no_telepon?: string | null;
}

export interface PengaturanGuruData {
  profil: ProfilGuruData;
}

export async function getPengaturanGuruData(): Promise<{
  success: boolean;
  data?: PengaturanGuruData;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session || session.role !== "guru" || !session.guru_id) {
      return { success: false, error: "Sesi tidak valid atau bukan peran guru." };
    }

    const guruId = session.guru_id;
    const akunId = session.id;

    // Ambil data guru & akun terhubung
    const [guruRes, akunRes] = await Promise.all([
      supabaseAdmin
        .from("guru")
        .select("id, nama, nip, jabatan, no_telepon")
        .eq("id", guruId)
        .single(),
      supabaseAdmin
        .from("akun")
        .select("id, username")
        .eq("id", akunId)
        .single(),
    ]);

    if (guruRes.error || !guruRes.data) {
      return { success: false, error: "Data guru tidak ditemukan." };
    }

    const profil: ProfilGuruData = {
      id: guruRes.data.id,
      nama: guruRes.data.nama,
      nip: guruRes.data.nip || "-",
      username: akunRes.data?.username || session.username,
      jabatan: guruRes.data.jabatan,
      no_telepon: guruRes.data.no_telepon,
    };

    return {
      success: true,
      data: {
        profil,
      },
    };
  } catch (err: any) {
    return { success: false, error: handleActionError(err, "getPengaturanGuruData", "Terjadi kesalahan saat memuat data profil.") };
  }
}

export async function gantiPasswordGuruAction(input: {
  passwordLama: string;
  passwordBaru: string;
  konfirmasiPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== "guru") {
      return { success: false, error: "Akses ditolak: Sesi tidak valid atau bukan peran guru." };
    }

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
      .single();

    if (akunError || !akun) {
      return { success: false, error: "Akun guru tidak ditemukan atau sedang nonaktif." };
    }

    const isMatch = await bcrypt.compare(passwordLama, akun.password_hash);
    if (!isMatch) {
      return { success: false, error: "Kata sandi saat ini (lama) salah." };
    }

    // 5. Hash Password Baru dan Simpan
    const password_hash = await bcrypt.hash(passwordBaru, 10);
    const { error: updateError } = await supabaseAdmin
      .from("akun")
      .update({ password_hash })
      .eq("id", session.id);

    if (updateError) {
      console.error("Gagal update password guru:", updateError);
      return { success: false, error: "Gagal menyimpan kata sandi baru ke database." };
    }

    return {
      success: true,
      message: "Kata sandi akun Anda berhasil diperbarui.",
    };
  } catch (err: any) {
    return { success: false, error: handleActionError(err, "gantiPasswordGuruAction", "Terjadi kesalahan internal pada server.") };
  }
}

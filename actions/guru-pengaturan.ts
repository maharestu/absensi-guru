"use server";

/**
 * SERVER ACTIONS — PENGATURAN GURU
 * 
 * Menyediakan endpoint aman bagi peran guru untuk:
 * 1. Mengambil data profil personal, statistik & riwayat kehadiran
 * 2. Mengambil informasi jadwal dan alokasi kelas mengajar
 * 3. Mengubah kata sandi (password) akun guru secara aman dengan bcrypt
 */

import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export interface RiwayatKehadiranItem {
  id: string;
  tanggal: string;
  waktu_submit: string;
  waktu_pulang?: string | null;
  status: string;
  foto_absensi?: string | null;
  file_bukti_izin_sakit?: string | null;
}

export interface JadwalMengajarItem {
  id: string;
  mata_pelajaran: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  nama_kelas: string;
}

export interface PengaturanGuruData {
  profil: {
    id: string;
    nama: string;
    nip: string;
    username: string;
    jabatan?: string | null;
    no_telepon?: string | null;
  };
  kehadiranStatistik: {
    totalHadir: number;
    totalIzin: number;
    totalSakit: number;
    totalDinas: number;
    totalTidakHadir: number;
    persentaseHadir: number;
    totalHariTercatat: number;
  };
  riwayatKehadiran: RiwayatKehadiranItem[];
  jadwalMengajar: JadwalMengajarItem[];
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

    // 1. Ambil data guru & akun
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

    const profil = {
      id: guruRes.data.id,
      nama: guruRes.data.nama,
      nip: guruRes.data.nip || "-",
      username: akunRes.data?.username || session.username,
      jabatan: guruRes.data.jabatan,
      no_telepon: guruRes.data.no_telepon,
    };

    // 2. Ambil data absensi kehadiran
    const { data: absensiList, error: absensiError } = await supabaseAdmin
      .from("absensi_masuk")
      .select("id, tanggal, waktu_submit, waktu_pulang, status, foto_absensi, file_bukti_izin_sakit")
      .eq("guru_id", guruId)
      .order("tanggal", { ascending: false })
      .limit(60);

    if (absensiError) {
      console.error("Gagal mengambil riwayat absensi guru:", absensiError);
    }

    const riwayatKehadiran: RiwayatKehadiranItem[] = (absensiList || []).map((row) => ({
      id: row.id,
      tanggal: row.tanggal,
      waktu_submit: row.waktu_submit ? String(row.waktu_submit) : "-",
      waktu_pulang: row.waktu_pulang ? String(row.waktu_pulang) : null,
      status: row.status,
      foto_absensi: row.foto_absensi,
      file_bukti_izin_sakit: row.file_bukti_izin_sakit,
    }));

    // Hitung statistik
    let totalHadir = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalDinas = 0;
    let totalTidakHadir = 0;

    riwayatKehadiran.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s === "hadir") totalHadir++;
      else if (s === "izin") totalIzin++;
      else if (s === "sakit") totalSakit++;
      else if (s === "dinas") totalDinas++;
      else if (s === "tidak_hadir") totalTidakHadir++;
    });

    const totalHariTercatat = riwayatKehadiran.length;
    const persentaseHadir = totalHariTercatat > 0
      ? Math.round((totalHadir / totalHariTercatat) * 100)
      : 0;

    const kehadiranStatistik = {
      totalHadir,
      totalIzin,
      totalSakit,
      totalDinas,
      totalTidakHadir,
      persentaseHadir,
      totalHariTercatat,
    };

    // 3. Ambil data jadwal mengajar aktif
    const { data: jadwalList, error: jadwalError } = await supabaseAdmin
      .from("jadwal")
      .select("id, mata_pelajaran, hari, jam_mulai, jam_selesai, status, kelas:kelas_id(id, nama_kelas)")
      .eq("guru_id", guruId)
      .eq("status", "aktif")
      .order("hari")
      .order("jam_mulai");

    if (jadwalError) {
      console.error("Gagal mengambil jadwal mengajar guru:", jadwalError);
    }

    const HARI_ORDER: Record<string, number> = {
      senin: 1,
      selasa: 2,
      rabu: 3,
      kamis: 4,
      jumat: 5,
    };

    const jadwalMengajar: JadwalMengajarItem[] = (jadwalList || [])
      .map((row: any) => ({
        id: row.id,
        mata_pelajaran: row.mata_pelajaran,
        hari: row.hari,
        jam_mulai: row.jam_mulai ? row.jam_mulai.slice(0, 5) : "-",
        jam_selesai: row.jam_selesai ? row.jam_selesai.slice(0, 5) : "-",
        nama_kelas: row.kelas?.nama_kelas || "-",
      }))
      .sort((a, b) => (HARI_ORDER[a.hari] || 99) - (HARI_ORDER[b.hari] || 99));

    return {
      success: true,
      data: {
        profil,
        kehadiranStatistik,
        riwayatKehadiran,
        jadwalMengajar,
      },
    };
  } catch (err: any) {
    console.error("Error getPengaturanGuruData:", err);
    return { success: false, error: err.message || "Terjadi kesalahan saat memuat data." };
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
    console.error("Error gantiPasswordGuruAction:", err);
    return { success: false, error: err.message || "Terjadi kesalahan internal pada server." };
  }
}

/**
 * Modul Terpusat Penanganan & Sanitasi Pesan Kesalahan (Error Handler)
 *
 * Mengubah pesan error teknis, database (PostgreSQL/Supabase), dan backend
 * menjadi pesan bahasa Indonesia yang ramah, informatif, dan mudah dipahami pengguna.
 * Detail teknis tetap dicatat ke console server untuk kebutuhan debugging developer.
 */

import { RoleAkun } from "@/types/schema";

/**
 * Mendapatkan rute dashboard resmi berdasarkan role pengguna
 */
export function getDashboardPath(role?: RoleAkun | string | null): string {
  if (role === "guru") return "/guru";
  if (role === "kepala_sekolah") return "/kepsek";
  return "/admin";
}

interface RawErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  name?: string;
}

/**
 * Menganalisis dan menyaring error ke kalimat bahasa Indonesia yang ramah pengguna
 */
export function sanitizeErrorMessage(
  error: unknown,
  customFallback?: string
): string {
  if (!error) {
    return customFallback || "Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.";
  }

  const errObj = (typeof error === "object" ? error : {}) as RawErrorLike;
  const rawMsg =
    typeof error === "string"
      ? error
      : errObj.message || String(error || "");
  const code = String(errObj.code || "");
  const details = String(errObj.details || "");
  const combined = `${code} ${rawMsg} ${details}`.toLowerCase();

  // 1. DUPLIKASI DATA / UNIQUE CONSTRAINT (Kode 23505 / duplicate key / duplicate_name)
  if (
    code === "23505" ||
    combined.includes("23505") ||
    combined.includes("duplicate") ||
    combined.includes("duplicate_name") ||
    combined.includes("already exists") ||
    combined.includes("unique constraint")
  ) {
    if (combined.includes("nip") || combined.includes("guru_nip_key")) {
      return "NIP/NUPTK tersebut sudah terdaftar di sistem. Gunakan NIP yang berbeda.";
    }
    if (combined.includes("username") || combined.includes("akun_username_key")) {
      return "Username tersebut sudah digunakan. Silakan pilih username lain.";
    }
    if (combined.includes("guru_id") || combined.includes("akun_guru_id_key")) {
      return "Guru ini sudah memiliki akun login yang terdaftar.";
    }
    if (
      combined.includes("nama_kelas") ||
      combined.includes("kelas_nama_kelas_key") ||
      combined.includes("duplicate_name")
    ) {
      return "Nama kelas tersebut sudah terdaftar. Silakan gunakan nama lain.";
    }
    if (combined.includes("kode_qr") || combined.includes("kelas_kode_qr_key")) {
      return "Kode QR kelas sudah terdaftar di sistem.";
    }
    if (combined.includes("hari_libur") || combined.includes("hari_libur_pkey")) {
      return "Tanggal tersebut sudah terdaftar sebagai hari libur.";
    }
    if (
      combined.includes("absensi_masuk") ||
      combined.includes("unique_absensi_masuk_harian")
    ) {
      return "Anda sudah melakukan absensi masuk untuk hari ini.";
    }
    if (
      combined.includes("absensi_mengajar") ||
      combined.includes("unique_absensi_mengajar_sesi")
    ) {
      return "Absensi mengajar untuk jadwal ini pada hari ini sudah pernah dilakukan.";
    }
    return "Data yang dimasukkan sudah ada di dalam sistem. Harap periksa kembali.";
  }

  // 2. RELASI DATA / FOREIGN KEY CONSTRAINT (Kode 23503 / foreign key violation)
  if (
    code === "23503" ||
    combined.includes("23503") ||
    combined.includes("foreign key") ||
    combined.includes("violates foreign key constraint") ||
    combined.includes("is still referenced")
  ) {
    if (combined.includes("absensi_masuk") || combined.includes("absensi_mengajar")) {
      return "Data tidak dapat dihapus karena masih memiliki riwayat absensi terkait.";
    }
    if (combined.includes("jadwal")) {
      return "Data tidak dapat dihapus karena masih terhubung dengan jadwal pelajaran aktif.";
    }
    if (combined.includes("akun")) {
      return "Data tidak dapat dihapus karena masih terhubung dengan akun login aktif.";
    }
    return "Data tidak dapat dihapus atau diubah karena masih terhubung dengan data lain di sistem.";
  }

  // 3. NILAI KOSONG / NOT-NULL CONSTRAINT (Kode 23502)
  if (
    code === "23502" ||
    combined.includes("23502") ||
    combined.includes("violates not-null") ||
    combined.includes("null value in column")
  ) {
    return "Terdapat kolom wajib yang belum diisi. Harap lengkapi semua data yang diperlukan.";
  }

  // 4. CHECK CONSTRAINT (Kode 23514)
  if (
    code === "23514" ||
    combined.includes("23514") ||
    combined.includes("violates check constraint")
  ) {
    return "Nilai data yang dimasukkan tidak valid atau berada di luar batas yang ditentukan.";
  }

  // 5. KENDALA KONEKSI / JARINGAN / FETCH
  if (
    combined.includes("failed to fetch") ||
    combined.includes("networkerror") ||
    combined.includes("fetch failed") ||
    combined.includes("econnrefused") ||
    combined.includes("etimedout") ||
    combined.includes("network request failed")
  ) {
    return "Gagal terhubung ke server database. Periksa koneksi internet Anda dan silakan coba beberapa saat lagi.";
  }

  // 6. KENDALA SESI / OTORISASI
  if (
    combined.includes("jwt expired") ||
    combined.includes("pgrst301") ||
    combined.includes("sesi anda telah berakhir")
  ) {
    return "Sesi Anda telah berakhir. Silakan login kembali.";
  }

  // 7. Jika pesan sudah berupa bahasa Indonesia bersih (tanpa istilah teknis SQL/DB)
  const technicalIndicators = [
    "violates",
    "constraint",
    "syntax error",
    "relation \"",
    "column \"",
    "pgrst",
    "status code",
    "internal server error",
    "database error",
    "supabase",
    "postgresql",
    "table \"",
    "null value",
    "foreign key",
    "unique_violation",
    "stack trace",
  ];

  const hasTechnicalTerms = technicalIndicators.some((term) =>
    combined.includes(term)
  );

  if (!hasTechnicalTerms && rawMsg.trim().length > 0) {
    return rawMsg.trim();
  }

  return (
    customFallback ||
    "Terjadi kendala pada sistem saat memproses permintaan. Silakan coba beberapa saat lagi."
  );
}

/**
 * Mencatat log teknis untuk kebutuhan developer dan mengembalikan pesan yang sudah disanitasi
 */
export function handleActionError(
  error: unknown,
  context: string,
  customFallback?: string
): string {
  // Catat detail teknis asli ke log server untuk developer debugging
  console.error(`[SERVER_ERROR][${context}]`, error);

  return sanitizeErrorMessage(error, customFallback);
}


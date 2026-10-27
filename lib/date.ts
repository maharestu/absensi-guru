const TZ = "Asia/Jakarta";

export const JAM_MASUK_SEKOLAH = "07:00";
export const JAM_CUTOFF_ABSENSI = "16:00";
export const TOLERANSI_TERLAMBAT_MENIT = 5;
/** Tanggal mulai berlakunya pencatatan otomatis status 'Tidak Hadir' (Sabtu, 24 Oktober 2026) */
export const TANGGAL_MULAI_TIDAK_HADIR = "2026-10-30";
/** Tanggal mulai berlakunya pencatatan otomatis status 'Tidak Mengajar' */
export const TANGGAL_MULAI_TIDAK_MENGAJAR = "2026-10-30";

/** "YYYY-MM-DD" sesuai WIB */
export function getTodayWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** "senin" | "selasa" | ... | "minggu" sesuai WIB */
export function getHariWIB(): string {
  const nama = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  const day = new Date(new Date().toLocaleString("en-US", { timeZone: TZ })).getDay();
  return nama[day];
}

/** Pengecekan apakah suatu tanggal (atau hari ini jika kosong) adalah Sabtu atau Minggu di zona waktu WIB */
export function isWeekendWIB(dateInput?: Date | string): boolean {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [y, m, d] = dateInput.trim().split("-").map(Number);
    // 05:00 UTC = 12:00 WIB tengah hari agar stabil
    const dObj = new Date(Date.UTC(y, m - 1, d, 5, 0, 0));
    const hari = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(dObj).toLowerCase();
    return hari.startsWith("sat") || hari.startsWith("sun");
  }
  const dateObj = dateInput ? (typeof dateInput === "string" ? new Date(dateInput) : dateInput) : new Date();
  const hari = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(dateObj).toLowerCase();
  return hari.startsWith("sat") || hari.startsWith("sun");
}

/** Mengembalikan true jika waktu WIB saat ini sudah melewati jam batas cut-off absensi harian (default 16:00) */
export function isPastCutoffTodayWIB(cutoffJamStr: string = JAM_CUTOFF_ABSENSI): boolean {
  const { jam: nowJam, menit: nowMenit } = getJamMenitWIB(new Date());
  const { jam: targetJam, menit: targetMenit } = getJamMenitWIB(cutoffJamStr);
  return (nowJam * 60 + nowMenit) >= (targetJam * 60 + targetMenit);
}

export type FaseWaktuSekolah =
  | "akhir_pekan"
  | "sebelum_masuk"
  | "jam_sekolah"
  | "setelah_pulang";

/**
 * Menentukan fase waktu sekolah hari ini berbasis WIB:
 * - akhir_pekan: Sabtu & Minggu (libur)
 * - sebelum_masuk: Senin-Jumat sebelum pukul 07:00 WIB
 * - jam_sekolah: Senin-Jumat pukul 07:00 s.d. 15:59 WIB
 * - setelah_pulang: Senin-Jumat pukul 16:00 WIB ke atas
 */
export function getFaseWaktuSekolah(): FaseWaktuSekolah {
  if (isWeekendWIB()) return "akhir_pekan";

  const { jam, menit } = getJamMenitWIB(new Date());
  const totalMenit = jam * 60 + menit;

  const { jam: mJam, menit: mMenit } = getJamMenitWIB(JAM_MASUK_SEKOLAH);
  const masukMenit = mJam * 60 + mMenit; // 07:00 -> 420

  const { jam: pJam, menit: pMenit } = getJamMenitWIB(JAM_CUTOFF_ABSENSI);
  const pulangMenit = pJam * 60 + pMenit; // 16:00 -> 960

  if (totalMenit < masukMenit) return "sebelum_masuk";
  if (totalMenit < pulangMenit) return "jam_sekolah";
  return "setelah_pulang";
}

/** "HH:MM:SS" sesuai WIB, untuk dibandingkan dengan jam_mulai/jam_selesai */
export function getJamWIB(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

/** Ekstrak jam dan menit dalam zona waktu WIB */
export function getJamMenitWIB(d: Date | string): { jam: number; menit: number } {
  if (typeof d === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(d.trim())) {
    const parts = d.trim().split(":").map(Number);
    return { jam: parts[0], menit: parts[1] };
  }

  const dateObj = typeof d === "string" ? new Date(d) : d;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(dateObj);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { jam: hour, menit: minute };
}

/** Format waktu ke "HH:mm" WIB */
export function formatJamWIB(d: Date | string): string {
  const { jam, menit } = getJamMenitWIB(d);
  return `${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}`;
}

export interface KeterlambatanInfo {
  terlambat: boolean;
  menit: number;
  label: string;
}

/**
 * Konversi total menit keterlambatan ke format komunikatif jam dan menit.
 * Contoh:
 * - 45 -> "45 menit"
 * - 60 -> "1 jam"
 * - 90 -> "1 jam 30 menit"
 * - 120 -> "2 jam"
 */
export function formatDurasiKeterlambatan(totalMenit: number): string {
  if (totalMenit <= 0) return "0 menit";

  const jam = Math.floor(totalMenit / 60);
  const sisaMenit = totalMenit % 60;

  if (jam === 0) {
    return `${sisaMenit} menit`;
  }
  if (sisaMenit === 0) {
    return `${jam} jam`;
  }
  return `${jam} jam ${sisaMenit} menit`;
}

/**
 * Hitung keterlambatan berdasarkan target jam dan batas toleransi.
 * Contoh: target "07:00", waktu absen "07:18", toleransi 5 menit -> Terlambat 18 menit.
 */
export function hitungKeterlambatan(
  waktuAbsen: Date | string,
  targetJamStr: string = JAM_MASUK_SEKOLAH,
  toleransiMenit: number = TOLERANSI_TERLAMBAT_MENIT
): KeterlambatanInfo {
  const { jam: jamAbsen, menit: menitAbsen } = getJamMenitWIB(waktuAbsen);
  const { jam: targetJam, menit: targetMenit } = getJamMenitWIB(targetJamStr);

  const totalMenitAbsen = jamAbsen * 60 + menitAbsen;
  const totalMenitTarget = targetJam * 60 + targetMenit;
  const selisihMenit = totalMenitAbsen - totalMenitTarget;

  if (selisihMenit <= toleransiMenit) {
    return {
      terlambat: false,
      menit: 0,
      label: "Tepat Waktu",
    };
  }

  return {
    terlambat: true,
    menit: selisihMenit,
    label: `Terlambat ${formatDurasiKeterlambatan(selisihMenit)}`,
  };
}

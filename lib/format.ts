/**
 * FORMAT UTILITIES — Tanggal & Waktu Indonesia
 *
 * Modul utilitas untuk memformat tanggal dan waktu dalam bahasa Indonesia.
 * Satu sumber kebenaran agar tidak ada duplikasi formatter di seluruh proyek.
 */

const TZ_JAKARTA = "Asia/Jakarta";

/**
 * Format tanggal ke "17 September 2026" (tanpa hari) dalam zona WIB.
 */
export function formatTanggalIndo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    timeZone: TZ_JAKARTA,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format tanggal ke "Senin, 17 September 2026" (dengan hari) dalam zona WIB.
 */
export function formatTanggalLengkap(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    timeZone: TZ_JAKARTA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format jam ke "06:30" (WIB).
 */
export function formatJamIndo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ_JAKARTA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Mendapatkan tanggal dan waktu saat ini dalam format Indonesia (WIB).
 * Digunakan untuk tampilan absensi kehadiran.
 *
 * @returns { date: "Senin, 7 September 2026", time: "06:30 WIB" }
 */
export function getDynamicDateTime(dateInput: Date | string = new Date()): { date: string; time: string } {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const dateStr = formatTanggalLengkap(d);
  const timeStr = formatJamIndo(d);

  return {
    date: dateStr,
    time: `${timeStr} WIB`,
  };
}

/**
 * Normalisasi string jam dari Excel atau input ke format standar database HH:mm:ss (8 karakter).
 * Mencegah error Postgres `date/time field value out of range` bila ada data tanpa titik seperti "0850".
 * Contoh:
 * - "07:30" / "07.30" -> "07:30:00"
 * - "07:30:00" -> "07:30:00"
 * - "0850" -> "08:50:00"
 * - "830" -> "08:30:00"
 */
export function normalizeTimeString(t: string): string {
  if (!t) return "07:00:00";
  const clean = t.trim().replace(".", ":");

  // Format 1: Mengandung pemisah titik dua (HH:mm atau HH:mm:ss)
  if (clean.includes(":")) {
    const parts = clean.split(":");
    const h = (parts[0] || "07").padStart(2, "0");
    const m = (parts[1] || "00").padStart(2, "0");
    const s = (parts[2] || "00").padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // Format 2: 4 digit tanpa pemisah (misal: "0850" -> 08:50:00)
  const match4 = clean.match(/^(\d{2})(\d{2})$/);
  if (match4) {
    return `${match4[1]}:${match4[2]}:00`;
  }

  // Format 3: 3 digit tanpa pemisah (misal: "850" -> 08:50:00)
  const match3 = clean.match(/^(\d{1})(\d{2})$/);
  if (match3) {
    return `0${match3[1]}:${match3[2]}:00`;
  }

  return "07:00:00";
}


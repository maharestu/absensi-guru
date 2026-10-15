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

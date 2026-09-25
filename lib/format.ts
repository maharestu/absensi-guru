/**
 * FORMAT UTILITIES — Tanggal & Waktu Indonesia
 *
 * Modul utilitas untuk memformat tanggal dan waktu dalam bahasa Indonesia.
 * Satu sumber kebenaran agar tidak ada duplikasi formatter di seluruh proyek.
 */

/**
 * Format tanggal ke "17 September 2026" (tanpa hari).
 */
export function formatTanggalIndo(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format tanggal ke "Senin, 17 September 2026" (dengan hari).
 */
export function formatTanggalLengkap(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format jam ke "06:30".
 */
export function formatJamIndo(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Mendapatkan tanggal dan waktu saat ini dalam format Indonesia.
 * Digunakan untuk tampilan absensi kehadiran.
 *
 * @returns { date: "Senin, 7 September 2026", time: "06:30 WIB" }
 */
export function getDynamicDateTime(): { date: string; time: string } {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return {
    date: `${dayName}, ${date} ${month} ${year}`,
    time: `${hours}:${minutes} WIB`,
  };
}

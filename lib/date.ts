const TZ = "Asia/Jakarta";

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

/** "HH:MM:SS" sesuai WIB, untuk dibandingkan dengan jam_mulai/jam_selesai */
export function getJamWIB(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

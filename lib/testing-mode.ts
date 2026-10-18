/**
 * TESTING & SIMULATION MODE HELPER
 * Digunakan untuk pengujian fleksibel tanpa terikat batasan weekend, jam mengajar, atau GPS.
 */

export interface DevTestingConfig {
  isActive: boolean;
  simDay: string;       // "senin" | "selasa" | "rabu" | "kamis" | "jumat"
  bypassGps: boolean;   // Abaikan radius geofence sekolah
  bypassTime: boolean;  // Abaikan batas rentang jam_mulai & jam_selesai mengajar
  bypassPrereq: boolean;// Boleh absen mengajar tanpa perlu absen kehadiran terlebih dahulu
}

export const DEFAULT_TESTING_CONFIG: DevTestingConfig = {
  isActive: false,
  simDay: "senin",
  bypassGps: true,
  bypassTime: true,
  bypassPrereq: true,
};

/**
 * Server-side helper untuk membaca konfigurasi testing dari cookies
 */
export async function getDevTestingConfigServer(): Promise<DevTestingConfig> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    const isActive = cookieStore.get("dev_test_active")?.value === "true";
    const simDay = cookieStore.get("dev_test_day")?.value || "senin";
    const bypassGps = cookieStore.get("dev_test_gps")?.value !== "false";
    const bypassTime = cookieStore.get("dev_test_time")?.value !== "false";
    const bypassPrereq = cookieStore.get("dev_test_prereq")?.value !== "false";

    return {
      isActive,
      simDay,
      bypassGps,
      bypassTime,
      bypassPrereq,
    };
  } catch {
    return DEFAULT_TESTING_CONFIG;
  }
}

/**
 * Client-side helper untuk membaca konfigurasi testing dari document.cookie
 */
export function getDevTestingConfigClient(): DevTestingConfig {
  if (typeof document === "undefined") {
    return DEFAULT_TESTING_CONFIG;
  }

  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const isActive = getCookie("dev_test_active") === "true";
  const simDay = getCookie("dev_test_day") || "senin";
  const bypassGps = getCookie("dev_test_gps") !== "false";
  const bypassTime = getCookie("dev_test_time") !== "false";
  const bypassPrereq = getCookie("dev_test_prereq") !== "false";

  return {
    isActive,
    simDay,
    bypassGps,
    bypassTime,
    bypassPrereq,
  };
}

/**
 * Client-side helper untuk menyimpan konfigurasi testing ke document.cookie
 */
export function setDevTestingConfigClient(config: Partial<DevTestingConfig>) {
  if (typeof document === "undefined") return;

  const current = getDevTestingConfigClient();
  const updated = { ...current, ...config };

  const expires = "; max-age=86400; path=/"; // 24 jam

  document.cookie = `dev_test_active=${updated.isActive}${expires}`;
  document.cookie = `dev_test_day=${updated.simDay}${expires}`;
  document.cookie = `dev_test_gps=${updated.bypassGps}${expires}`;
  document.cookie = `dev_test_time=${updated.bypassTime}${expires}`;
  document.cookie = `dev_test_prereq=${updated.bypassPrereq}${expires}`;
}

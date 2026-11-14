/**
 * MONITORING KELAS UTILITIES
 * Fungsi murni untuk evaluasi waktu jadwal, ekstraksi tingkat kelas, dan pemetaan status.
 */

/**
 * Helper murni untuk mengevaluasi apakah waktu tertentu berada dalam rentang jadwal.
 * Mengembalikan true jika now >= jamMulai dan now < jamSelesai.
 */
export function isWaktuDalamJadwal(
  nowTime: string,
  jamMulai: string,
  jamSelesai: string
): boolean {
  if (!nowTime || !jamMulai || !jamSelesai) return false;

  const normalize = (t: string) => {
    const trimmed = t.trim();
    if (trimmed.length === 5) return `${trimmed}:00`;
    return trimmed.slice(0, 8);
  };

  const n = normalize(nowTime);
  const start = normalize(jamMulai);
  const end = normalize(jamSelesai);

  return n >= start && n < end;
}

/**
 * Helper untuk mengekstrak tingkat kelas dari nama kelas (misal: "Kelas 7A" -> "7")
 */
export function ekstrakTingkatKelas(namaKelas: string): "7" | "8" | "9" | "Lainnya" {
  const norm = (namaKelas || "").toLowerCase();
  if (norm.includes("7") || norm.includes("vii")) return "7";
  if (norm.includes("8") || norm.includes("viii")) return "8";
  if (norm.includes("9") || norm.includes("ix")) return "9";
  return "Lainnya";
}


/**
 * NAME MATCHER UTILITIES
 *
 * Utilitas untuk membersihkan string nama dan mencocokkan nama guru
 * dari berbagai sumber (File Profil PTK vs Legenda Jadwal KBM)
 * yang memiliki variasi penulisan gelar atau singkatan.
 */

/**
 * Membersihkan string nama: mengambil nama sebelum koma gelar,
 * menghapus tanda baca non-alfanumerik, dan mengubah ke huruf kecil.
 */
export function cleanNameString(name: string): string {
  if (!name) return "";
  const cleanName = name.split(",")[0];
  return cleanName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/**
 * Fungsi pintar untuk mencocokkan nama guru:
 * Mendukung variasi penulisan singkatan nama dan gelar.
 * Contoh:
 * - "Awaliatush S" == "Awaliatush Sholihah" -> true
 * - "Rosemalyna K" == "Rosemalyna Khatimah Rusman Putri" -> true
 * - "Ulfah Nurul" == "Ulfah Nurul Hikmawati" -> true
 * - "Siti Barkah" == "Siti Mustikah" -> false
 */
export function isNameMatch(nameA: string, nameB: string): boolean {
  const cleanA = cleanNameString(nameA);
  const cleanB = cleanNameString(nameB);

  if (cleanA === cleanB) return true;

  const tokensA = cleanA.split(/\s+/).filter(Boolean);
  const tokensB = cleanB.split(/\s+/).filter(Boolean);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Jika token pertama (nama depan) tidak sama, pasti beda orang
  if (tokensA[0] !== tokensB[0]) return false;

  // Jika nama depan cocok, bandingkan setiap token kata berikutnya
  for (let i = 0; i < Math.min(tokensA.length, tokensB.length); i++) {
    if (!tokensA[i].startsWith(tokensB[i]) && !tokensB[i].startsWith(tokensA[i])) {
      return false;
    }
  }

  return true;
}

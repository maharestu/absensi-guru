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
  
  // 1. Ambil nama sebelum koma (menghapus gelar belakang seperti , S.Pd)
  let cleanName = name.split(",")[0].trim();

  // 2. Hapus gelar depan (Drs, Dra, Dr, H, Hj, Prof, Ir, KH, Ustadz, dsb) secara berulang (multi-gelar)
  const PREFIX_TITLES = /^(drs|dra|dr|prof|ir|h|hj|kh|k\.h|ust|ustadz)\.?(\s+|$)/i;
  let prevName = "";
  while (prevName !== cleanName) {
    prevName = cleanName;
    cleanName = cleanName.replace(PREFIX_TITLES, "").trim();
  }

  // 3. Bersihkan karakter non-alfanumerik dan ubah ke lowercase
  return cleanName.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fungsi pintar untuk mencocokkan nama guru:
 * Mendukung variasi penulisan singkatan nama dan gelar.
 * Contoh:
 * - "Awaliatush S" == "Awaliatush Sholihah" -> true
 * - "Rosemalyna K" == "Rosemalyna Khatimah Rusman Putri" -> true
 * - "Ulfah Nurul" == "Ulfah Nurul Hikmawati" -> true
 * - "Siti Barkah" == "Siti Mustikah" -> false
 * - "Ahmad Dahlan" == "Drs. H. Ahmad Dahlan, M.Pd." -> true
 */
export function isNameMatch(nameA: string, nameB: string): boolean {
  const cleanA = cleanNameString(nameA);
  const cleanB = cleanNameString(nameB);

  if (cleanA === cleanB) return true;

  const tokensA = cleanA.split(/\s+/).filter(Boolean);
  const tokensB = cleanB.split(/\s+/).filter(Boolean);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Jika nama depan sama persis, ATAU salah satu merupakan singkatan satu huruf (misal: "M." vs "Muhammad")
  const firstMatch =
    tokensA[0] === tokensB[0] ||
    (tokensA[0].length === 1 && tokensB[0].startsWith(tokensA[0])) ||
    (tokensB[0].length === 1 && tokensA[0].startsWith(tokensB[0]));

  if (!firstMatch) return false;

  // Bandingkan setiap token kata berikutnya
  for (let i = 1; i < Math.min(tokensA.length, tokensB.length); i++) {
    if (!tokensA[i].startsWith(tokensB[i]) && !tokensB[i].startsWith(tokensA[i])) {
      return false;
    }
  }

  return true;
}

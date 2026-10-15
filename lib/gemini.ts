import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedData } from "@/actions/import";

/**
 * Inisialisasi client Gemini AI.
 * Mengambil API key dari parameter, atau environment variable GEMINI_API_KEY.
 */
export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Kunci API AI (GEMINI_API_KEY) belum dikonfigurasi di server (.env.local atau Environment Variables). Silakan tambahkan kunci API di pengaturan server."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });
}

/**
 * Format prompt instruksi untuk AI agar mengekstraksi data PTK dan Jadwal KBM
 * ke dalam format ParsedData terstandarisasi.
 */
export async function parseExcelDataWithGemini(
  ptkMatrix: any[][],
  kbmMatrix: any[][]
): Promise<ParsedData> {
  const model = getGeminiModel();

  // Buat representasi ringkas untuk efisiensi token
  const ptkText = JSON.stringify(ptkMatrix.slice(0, 300));
  const kbmText = JSON.stringify(kbmMatrix.slice(0, 400));

  const prompt = `
Anda adalah asisten sistem absensi sekolah Indonesia yang sangat ahli dan presisi dalam menganalisis berkas Excel data pendidik (PTK) dan Jadwal KBM (Kegiatan Belajar Mengajar).

Berikut adalah data tabular mentah (array 2D) dari 2 berkas Excel:

--- BERKAS 1: DATA PTK (GURU & TENAGA KEPENDIDIKAN) ---
${ptkText}

--- BERKAS 2: DATA JADWAL KBM ---
${kbmText}

TUGAS ANDA:
Analisis kedua data di atas secara dinamis (tanpa memedulikan indeks baris/kolom) dan ekstrak menjadi format JSON terstruktur yang valid sesuai aturan berikut:

1. "ptk":
   - Cari baris header guru yang memuat nama, NIP, NUPTK, jenis PTK, dan gelar (depan/belakang jika ada).
   - Filter hanya yang merupakan "Guru" (abaikan tenaga administrasi, penjaga, dll. jika bukan guru).
   - Gabungkan nama lengkap beserta gelar depan dan gelar belakang (misal "Drs. H. Ahmad Subarjo, M.Pd").
   - Bentuk array objek: [{ "nama": string, "nip": string, "nuptk": string, "jenisPtk": string }]

2. "legendaGuru":
   - Cari bagian legenda/kode pengajar di berkas Jadwal KBM (biasanya tabel berisi kode angka atau singkatan dan nama lengkap guru).
   - Format: Objek pemetaan { [guruKode: string]: string (nama lengkap guru) }
   - Contoh: { "1": "Drs. H. Ahmad Subarjo, M.Pd", "2": "Budi Santoso, S.Pd" }

3. "legendaMapel":
   - Cari bagian legenda mata pelajaran di berkas Jadwal KBM (biasanya kode huruf seperti A, B, C atau singkatan mapel beserta nama mapel).
   - Format: Objek pemetaan { [mapelKode: string]: string (nama mata pelajaran) }
   - Contoh: { "A": "Matematika", "B": "Bahasa Indonesia", "C": "IPA" }

4. "kelases":
   - Cari semua nama ruang kelas (misal: "7A", "7B", "7C", "8A", "9A", dll).
   - Format: Array string unik nama kelas: ["7A", "7B", "7C", ...]

5. "jadwals" (SINTESIS BLOK JADWAL):
   - Telusuri kisi-kisi jadwal pelajaran per hari (Senin - Jumat) dan per kelas.
   - Deteksi hari, jam pelajaran (jam mulai & jam selesai dalam format "HH:MM:SS"), kode guru, dan kode mapel.
   - PENTING (BLOCK SCHEDULING): Jika seorang guru mengajar mata pelajaran yang sama di kelas yang sama pada jam-jam yang berurutan di hari yang sama (misal jam ke-1 07:00-07:40 dan jam ke-2 07:40-08:20), MAKA GABUNGKAN MENJADI SATU BLOK dengan jamMulai "07:00:00" dan jamSelesai "08:20:00".
   - Nama hari WAJIB menggunakan huruf kecil semua: "senin", "selasa", "rabu", "kamis", atau "jumat".
   - Abaikan baris/sel Upacara, Istirahat, Literasi, atau sel kosong.
   - Bentuk array objek:
     [{
       "guruKode": string,
       "mapelKode": string,
       "kelasNama": string,
       "hari": "senin" | "selasa" | "rabu" | "kamis" | "jumat",
       "jamMulai": "HH:MM:SS",
       "jamSelesai": "HH:MM:SS"
     }]

Hasilkan HANYA objek JSON dengan struktur:
{
  "ptk": [...],
  "legendaGuru": { ... },
  "legendaMapel": { ... },
  "kelases": [...],
  "jadwals": [...]
}
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const parsed: ParsedData = JSON.parse(responseText);
    
    // Normalisasi & validasi fallback
    if (!parsed.ptk) parsed.ptk = [];
    if (!parsed.legendaGuru) parsed.legendaGuru = {};
    if (!parsed.legendaMapel) parsed.legendaMapel = {};
    if (!parsed.kelases) parsed.kelases = [];
    if (!parsed.jadwals) parsed.jadwals = [];

    // Pastikan hari lowercase dan waktu format standard
    parsed.jadwals = parsed.jadwals.map((j) => ({
      ...j,
      hari: (j.hari || "senin").toLowerCase().trim(),
      jamMulai: normalizeTimeFormat(j.jamMulai),
      jamSelesai: normalizeTimeFormat(j.jamSelesai),
    }));

    return parsed;
  } catch (parseError: any) {
    console.error("Gagal parse JSON dari AI:", responseText);
    throw new Error("Gagal mengurai respons dari AI: " + parseError.message);
  }
}

/**
 * Normalisasi format jam ke "HH:MM:SS"
 */
function normalizeTimeFormat(timeStr?: string): string {
  if (!timeStr) return "07:00:00";
  const cleaned = timeStr.trim().replace(".", ":");
  const parts = cleaned.split(":");
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  }
  if (parts.length === 3) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
  }
  return "07:00:00";
}

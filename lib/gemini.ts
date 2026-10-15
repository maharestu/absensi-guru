import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedData } from "@/actions/import";

/**
 * Inisialisasi client Gemini AI.
 * Mengambil API key dari parameter, atau environment variable GEMINI_API_KEY.
 */
export const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
].filter((m): m is string => Boolean(m));

export function getGeminiModel(modelName = CANDIDATE_MODELS[0] || "gemini-3.5-flash") {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Kunci API AI (GEMINI_API_KEY) belum dikonfigurasi di server (.env.local atau Environment Variables). Silakan tambahkan kunci API di pengaturan server."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });
}

export interface KBMLayout {
  headerRowIndex?: number;
  startRowIndex?: number;
  endRowIndex?: number;
  hariCol?: number;
  waktuCol?: number;
  colToKelas?: Record<string | number, string>;
}

export interface AIParsedResponse extends ParsedData {
  kbmLayout?: KBMLayout;
}

/**
 * Mensintesis seluruh grid jadwal KBM menjadi blok-blok jadwal (Block Scheduling)
 * secara deterministik dan presisi 100%, menggunakan pemetaan layout dari AI.
 */
export function synthesizeJadwalGrid(
  kbmMatrix: any[][],
  layout?: KBMLayout
): ParsedData["jadwals"] {
  if (!kbmMatrix || kbmMatrix.length === 0) return [];

  let headerRowIndex = layout?.headerRowIndex ?? -1;
  const hariCol = layout?.hariCol ?? 0;
  const waktuCol = layout?.waktuCol ?? 2;
  const colToKelas: Record<number, string> = {};

  if (layout?.colToKelas && Object.keys(layout.colToKelas).length > 0) {
    for (const [colStr, kName] of Object.entries(layout.colToKelas)) {
      if (kName) colToKelas[parseInt(colStr, 10)] = String(kName).trim();
    }
  } else {
    // Auto-deteksi baris header kelas (7A, 8A, 9A, dll) jika AI tidak menyediakannya
    for (let r = 0; r < Math.min(15, kbmMatrix.length); r++) {
      const row = kbmMatrix[r];
      if (!row) continue;
      const rowStr = row.map((c) => String(c || "").trim()).join(" ");
      if (rowStr.includes("7A") || rowStr.includes("8A") || rowStr.includes("9A")) {
        headerRowIndex = r;
        break;
      }
    }

    if (headerRowIndex !== -1) {
      const hRow = kbmMatrix[headerRowIndex];
      for (let col = 3; col < hRow.length; col++) {
        const cell = String(hRow[col] || "").trim();
        if (cell && (cell.startsWith("7") || cell.startsWith("8") || cell.startsWith("9"))) {
          colToKelas[col] = cell;
        }
      }
    }
  }

  const startRowIndex = layout?.startRowIndex ?? (headerRowIndex !== -1 ? headerRowIndex + 1 : 6);
  const endRowIndex = layout?.endRowIndex ?? (kbmMatrix.length - 1);

  const jadwalsList: ParsedData["jadwals"] = [];
  let currentHari = "senin";

  for (const [colStr, kelasNama] of Object.entries(colToKelas)) {
    const col = parseInt(colStr, 10);
    let currentBlock: any = null;

    for (let r = startRowIndex; r <= endRowIndex && r < kbmMatrix.length; r++) {
      const row = kbmMatrix[r];
      if (!row) continue;

      const hariVal = String(row[hariCol] || "").trim().toLowerCase();
      if (hariVal.includes("senin")) currentHari = "senin";
      else if (hariVal.includes("selasa")) currentHari = "selasa";
      else if (hariVal.includes("rabu")) currentHari = "rabu";
      else if (hariVal.includes("kamis")) currentHari = "kamis";
      else if (hariVal.includes("jumat") || hariVal.includes("jum'at")) currentHari = "jumat";

      const waktuRaw = String(row[waktuCol] || "").trim();
      let jamMulaiStr = "07:00:00";
      let jamSelesaiStr = "14:00:00";
      if (waktuRaw.includes("-")) {
        const parts = waktuRaw.split("-").map((s) => s.trim().replace(".", ":"));
        if (parts[0]) jamMulaiStr = parts[0].length === 5 ? parts[0] + ":00" : parts[0];
        if (parts[1]) jamSelesaiStr = parts[1].length === 5 ? parts[1] + ":00" : parts[1];
      }

      const cellVal = String(row[col] || "").trim();
      const isBreakOrEmpty =
        !cellVal ||
        cellVal === "-" ||
        cellVal.toLowerCase().includes("istirahat") ||
        cellVal.toLowerCase().includes("upacara") ||
        cellVal.toLowerCase().includes("literasi") ||
        cellVal.toLowerCase().includes("dhuha") ||
        cellVal.toLowerCase().includes("senam");

      if (isBreakOrEmpty) {
        if (currentBlock) {
          jadwalsList.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      const match = cellVal.match(/^(\d+)([a-zA-Z]+)$/);
      if (match) {
        const guruKode = match[1];
        const mapelKode = match[2].toUpperCase();

        if (
          currentBlock &&
          currentBlock.guruKode === guruKode &&
          currentBlock.mapelKode === mapelKode &&
          currentBlock.hari === currentHari &&
          currentBlock.kelasNama === kelasNama
        ) {
          currentBlock.jamSelesai = jamSelesaiStr;
        } else {
          if (currentBlock) {
            jadwalsList.push(currentBlock);
          }
          currentBlock = {
            guruKode,
            mapelKode,
            kelasNama,
            hari: currentHari,
            jamMulai: jamMulaiStr,
            jamSelesai: jamSelesaiStr,
          };
        }
      } else {
        if (currentBlock) {
          jadwalsList.push(currentBlock);
          currentBlock = null;
        }
      }
    }

    if (currentBlock) {
      jadwalsList.push(currentBlock);
    }
  }

  return jadwalsList;
}

/**
 * Format prompt instruksi untuk AI agar mengekstraksi data PTK dan Jadwal KBM
 * ke dalam format ParsedData terstandarisasi.
 */
export async function parseExcelDataWithGemini(
  ptkMatrix: any[][],
  kbmMatrix: any[][]
): Promise<ParsedData> {
  // Ambil sample data yang representatif
  const ptkText = JSON.stringify(ptkMatrix.slice(0, 100));
  const kbmSample = JSON.stringify(kbmMatrix.slice(0, 50));

  const prompt = `
Anda adalah asisten sistem absensi sekolah Indonesia yang sangat ahli dan presisi dalam menganalisis struktur berkas Excel data PTK dan Jadwal KBM.

Berikut adalah data tabular (array 2D) dari 2 berkas Excel:

--- BERKAS 1: DATA PTK (GURU & TENAGA KEPENDIDIKAN) ---
${ptkText}

--- BERKAS 2: DATA JADWAL KBM ---
${kbmSample}

TUGAS ANDA:
Analisis kedua data di atas secara dinamis dan fleksibel (meskipun posisi baris/kolom berubah di masa depan) dan hasilkan objek JSON dengan struktur:

1. "ptk":
   - Cari baris header guru yang memuat Nama, NIP, NUPTK, Jenis PTK, dan Gelar (Depan/Belakang).
   - Filter hanya yang merupakan "Guru" (abaikan tenaga administrasi, penjaga, TU).
   - Gabungkan nama lengkap beserta gelar depan dan gelar belakang (misal "Awaliatush Sholihah, S.Pd").
   - Bentuk array objek: [{ "nama": string, "nip": string, "nuptk": string, "jenisPtk": string }]

2. "legendaGuru":
   - Cari bagian legenda/kode pengajar di berkas Jadwal KBM (biasanya tabel berisi kode angka dan nama lengkap guru).
   - Format: Objek pemetaan { [guruKode: string]: string (nama lengkap guru) }
   - Contoh: { "1": "ETI ANISYAH, S.Pd.", "2": "MARDIYAH, M.Pd." }

3. "legendaMapel":
   - Cari bagian legenda mata pelajaran di berkas Jadwal KBM (biasanya kode huruf seperti A, B, C dan nama mapel).
   - Format: Objek pemetaan { [mapelKode: string]: string (nama mapel) }
   - Contoh: { "A": "PAIBP", "B": "PPKn", "C": "B.Indonesia" }

4. "kelases":
   - Cari seluruh nama ruang kelas unik yang ada di header tabel jadwal (misal: ["7A", "7B", "7C", "8A", ...]).

5. "kbmLayout":
   - Deteksi tata letak grid jadwal KBM:
     - "headerRowIndex": indeks baris tempat nama-nama kelas berada (misal 5)
     - "startRowIndex": indeks baris jadwal pertama (misal 6 atau 7)
     - "hariCol": indeks kolom yang memuat nama hari (misal 0)
     - "waktuCol": indeks kolom yang memuat rentang jam pelajaran (misal 2)
     - "colToKelas": pemetaan indeks kolom ke nama kelas, contoh: { "3": "7A", "4": "7B", "5": "7C", ... }

Hasilkan HANYA JSON murni tanpa markdown tambahan:
{
  "ptk": [...],
  "legendaGuru": { ... },
  "legendaMapel": { ... },
  "kelases": [...],
  "kbmLayout": {
    "headerRowIndex": 5,
    "startRowIndex": 6,
    "hariCol": 0,
    "waktuCol": 2,
    "colToKelas": { "3": "7A", "4": "7B", ... }
  }
}
`;

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsed: AIParsedResponse = JSON.parse(responseText);

      // Normalisasi & validasi fallback
      if (!parsed.ptk) parsed.ptk = [];
      if (!parsed.legendaGuru) parsed.legendaGuru = {};
      if (!parsed.legendaMapel) parsed.legendaMapel = {};
      if (!parsed.kelases) parsed.kelases = [];

      // Sintesis grid jadwal secara presisi & deterministik menggunakan layout dari AI
      const synthesizedJadwals = synthesizeJadwalGrid(kbmMatrix, parsed.kbmLayout);

      if (synthesizedJadwals.length > 0) {
        parsed.jadwals = synthesizedJadwals;
        // Pastikan daftar kelas lengkap dari jadwal yang terdeteksi
        const detectedClasses = Array.from(new Set(synthesizedJadwals.map((j) => j.kelasNama)));
        if (detectedClasses.length > parsed.kelases.length) {
          parsed.kelases = detectedClasses;
        }
      } else if (!parsed.jadwals) {
        parsed.jadwals = [];
      }

      // Pastikan format jam terstandarisasi
      parsed.jadwals = parsed.jadwals.map((j) => ({
        ...j,
        hari: (j.hari || "senin").toLowerCase().trim(),
        jamMulai: normalizeTimeFormat(j.jamMulai),
        jamSelesai: normalizeTimeFormat(j.jamSelesai),
      }));

      return {
        ptk: parsed.ptk,
        legendaGuru: parsed.legendaGuru,
        legendaMapel: parsed.legendaMapel,
        kelases: parsed.kelases,
        jadwals: parsed.jadwals,
      };
    } catch (err: any) {
      lastError = err;
      const is503 =
        err?.status === 503 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("Service Unavailable");

      if (is503) {
        console.warn(
          `[Gemini AI] Model '${modelName}' sedang mengalami lonjakan antrean (503). Mencoba model alternatif...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Gagal memproses data dengan seluruh model Gemini yang tersedia.");
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

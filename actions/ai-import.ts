"use server";

import { requireAdmin } from "@/lib/session";
import { parseExcelDataWithGemini } from "@/lib/gemini";
import { ParsedData } from "@/actions/import";

export interface AIImportSummary {
  totalPtkGuru: number;
  totalKbmGuru: number;
  extraKbmGuru: number;
  totalGuruCombined: number;
  totalKelas: number;
  totalJadwalBlok: number;
  totalMapel: number;
}

export interface AIParseResult {
  success: boolean;
  data?: ParsedData;
  summary?: AIImportSummary;
  error?: string;
}

// Bantuan pencocokan nama sederhana untuk menghitung gabungan unik
function cleanName(name: string): string {
  if (!name) return "";
  return name.split(",")[0].toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function isNameSimilar(nameA: string, nameB: string): boolean {
  const a = cleanName(nameA);
  const b = cleanName(nameB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

/**
 * Server action untuk memproses data mentah sheet Excel dengan AI.
 */
export async function parseExcelWithAIAction(
  ptkMatrix: any[][],
  kbmMatrix: any[][]
): Promise<AIParseResult> {
  await requireAdmin();

  try {
    if (!ptkMatrix || ptkMatrix.length === 0) {
      throw new Error("Data file PTK kosong atau tidak terbaca.");
    }
    if (!kbmMatrix || kbmMatrix.length === 0) {
      throw new Error("Data file Jadwal KBM kosong atau tidak terbaca.");
    }

    // Ekstraksi terstruktur menggunakan AI
    const parsedData = await parseExcelDataWithGemini(ptkMatrix, kbmMatrix);

    // Hitung total guru unik dari KEDUA file (PTK + Legenda Jadwal KBM)
    const ptkNames = parsedData.ptk.map((p) => p.nama);
    const kbmTeachers = Object.values(parsedData.legendaGuru);

    let extraKbmGuru = 0;
    for (const kbmName of kbmTeachers) {
      const match = ptkNames.some((ptkName) => isNameSimilar(ptkName, kbmName));
      if (!match) {
        extraKbmGuru++;
      }
    }

    const totalPtkGuru = parsedData.ptk.length;
    const totalKbmGuru = kbmTeachers.length;
    // Total guru dari kedua file = semua PTK + guru di KBM yang belum ada di PTK
    const totalGuruCombined = totalPtkGuru + extraKbmGuru;

    const summary: AIImportSummary = {
      totalPtkGuru,
      totalKbmGuru,
      extraKbmGuru,
      totalGuruCombined,
      totalKelas: parsedData.kelases.length,
      totalJadwalBlok: parsedData.jadwals.length,
      totalMapel: Object.keys(parsedData.legendaMapel).length,
    };

    return {
      success: true,
      data: parsedData,
      summary,
    };
  } catch (error: any) {
    console.error("AI Import Error:", error);
    return {
      success: false,
      error: error.message || "Gagal memproses data dengan AI.",
    };
  }
}

export const parseExcelWithGeminiAction = parseExcelWithAIAction;

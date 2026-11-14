import * as XLSX from "xlsx-js-style";
import { normalizeTimeString } from "@/lib/format";
import { isNameMatch } from "@/lib/name-matcher";
import { ParsedData } from "@/actions/import";

type WorkBook = ReturnType<typeof XLSX.read>;

export type ParsedWorkbookResult = {
  success: boolean;
  error?: string;
  data?: ParsedData;
  skippedPtkGurus?: ParsedData["ptk"];
  kbmOnlyGurus?: { kode: string; nama: string }[];
  detectedSheets?: {
    ptkSheetName?: string;
    kbmSheetName?: string;
  };
};

/**
 * Normalisasi string nama kelas ke bentuk standar huruf besar tanpa spasi berlebih.
 * Contoh: "7a" -> "7A", "VII A" -> "VII A"
 */
function normalizeClassName(raw: string): string {
  return (raw || "").trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Parser Excel Dinamis & Fleksibel (Anchor-Based).
 * Mampu membaca satu workbook yang berisi 2 sheet (Data Guru & Jadwal KBM)
 * tanpa keterikatan kaku pada indeks kolom/baris tertentu.
 */
export function parseExcelWorkbookData(wb: WorkBook): ParsedWorkbookResult {
  const sheetNames = wb.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    return { success: false, error: "File Excel kosong atau tidak memiliki sheet yang dapat dibaca." };
  }

  // ==========================================================================
  // 1. DETEKSI NAMA SHEET DINAMIS (FUZZY SHEET FINDER)
  // ==========================================================================
  let ptkSheetName: string | undefined;
  let kbmSheetName: string | undefined;

  // Pencarian nama sheet Guru / PTK
  for (const s of sheetNames) {
    const sLow = s.toLowerCase();
    if (
      sLow.includes("guru") ||
      sLow.includes("ptk") ||
      sLow.includes("pegawai") ||
      sLow.includes("profil") ||
      sLow.includes("teacher")
    ) {
      ptkSheetName = s;
      break;
    }
  }

  // Pencarian nama sheet Jadwal KBM (Prioritas: 'jadwal' / 'kbm', hindari BUKU PIKET mendahului)
  for (const s of sheetNames) {
    const sLow = s.toLowerCase();
    if (sLow.includes("jadwal") || sLow.includes("kbm")) {
      kbmSheetName = s;
      break;
    }
  }
  if (!kbmSheetName) {
    for (const s of sheetNames) {
      const sLow = s.toLowerCase();
      if (sLow.includes("schedule") || sLow.includes("piket")) {
        kbmSheetName = s;
        break;
      }
    }
  }

  // Fallback deteksi isi jika nama sheet tidak mengandung kata kunci umum
  if (!ptkSheetName || !kbmSheetName) {
    for (const s of sheetNames) {
      const sheet = wb.Sheets[s];
      if (!sheet) continue;
      const sampleRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
      const textSample = sampleRows
        .slice(0, 15)
        .map((r) => (Array.isArray(r) ? r.join(" ") : ""))
        .join(" ")
        .toLowerCase();

      if (!ptkSheetName && (textSample.includes("nip") || textSample.includes("nuptk")) && textSample.includes("nama")) {
        ptkSheetName = s;
      }
      if (!kbmSheetName && (textSample.includes("kode guru") || textSample.includes("mata pelajaran") || textSample.includes("7a") || textSample.includes("vii"))) {
        kbmSheetName = s;
      }
    }
  }

  // Validasi minimal: Sheet Jadwal KBM harus ada
  if (!kbmSheetName) {
    return {
      success: false,
      error: "Sheet 'Jadwal KBM' tidak ditemukan dalam file Excel. Pastikan workbook memiliki sheet dengan nama 'Jadwal KBM' atau berisikan matriks jadwal pelajaran.",
      detectedSheets: { ptkSheetName, kbmSheetName },
    };
  }

  // ==========================================================================
  // 2. PARSING DINAMIS SHEET JADWAL KBM
  // ==========================================================================
  const wsKbm = wb.Sheets[kbmSheetName];
  const dataKbmRaw = XLSX.utils.sheet_to_json(wsKbm, { header: 1, defval: "" }) as any[][];

  // A. Ekstraksi Legenda Guru & Legenda Mapel Berbasis Jangkar (Anchor-Based)
  const legendaGuru: Record<string, string> = {};
  const legendaMapel: Record<string, string> = {};

  let guruAnchor: { r: number; c: number } | null = null;
  let mapelAnchor: { r: number; c: number } | null = null;

  for (let r = 0; r < dataKbmRaw.length; r++) {
    const row = dataKbmRaw[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] || "").trim().toLowerCase();
      if (!guruAnchor && (cellText === "kode guru" || cellText === "legenda guru" || cellText.includes("kode guru") || cellText.includes("legenda guru"))) {
        guruAnchor = { r, c };
      }
      if (!mapelAnchor && (cellText === "mata pelajaran" || cellText === "kode mapel" || cellText === "kode mata pelajaran" || cellText.includes("mata pelajaran") || cellText.includes("kode mapel"))) {
        mapelAnchor = { r, c };
      }
    }
  }

  // Baca tabel guru dari jangkar guru
  if (guruAnchor) {
    const cCode = guruAnchor.c;
    const cName = guruAnchor.c + 1;
    for (let r = guruAnchor.r + 1; r < dataKbmRaw.length; r++) {
      const row = dataKbmRaw[r];
      if (!row) continue;
      const codeVal = String(row[cCode] || "").trim();
      const nameVal = String(row[cName] || "").trim();

      // Berhenti jika menabrak header tabel mapel atau teks penutup
      if (String(row[cCode] || "").toLowerCase().includes("mata pelajaran")) break;
      if (String(row[cName] || "").toLowerCase().includes("mata pelajaran")) break;

      if (codeVal.match(/^\d+$/) && nameVal.length > 0 && !nameVal.match(/^\d+$/)) {
        legendaGuru[codeVal] = nameVal;
      }
    }
  }

  // Baca tabel mapel dari jangkar mapel
  if (mapelAnchor) {
    let cCode = mapelAnchor.c - 1;
    let cName = mapelAnchor.c;
    const anchorHeader = String(dataKbmRaw[mapelAnchor.r]?.[mapelAnchor.c] || "").toLowerCase();
    if (anchorHeader.includes("kode") && !anchorHeader.includes("mata")) {
      cCode = mapelAnchor.c;
      cName = mapelAnchor.c + 1;
    }

    for (let r = mapelAnchor.r + 1; r < dataKbmRaw.length; r++) {
      const row = dataKbmRaw[r];
      if (!row) continue;
      const codeVal = String(row[cCode] || "").trim().toUpperCase();
      const nameVal = String(row[cName] || "").trim();

      if (codeVal.match(/^[A-Z]{1,3}$/) && nameVal.length > 0 && !nameVal.match(/^\d+$/)) {
        legendaMapel[codeVal] = nameVal;
      }
    }
  }

  // Fallback pemindaian jika jangkar tidak bernama persis
  if (Object.keys(legendaGuru).length === 0 || Object.keys(legendaMapel).length === 0) {
    for (let r = 0; r < dataKbmRaw.length; r++) {
      const row = dataKbmRaw[r];
      if (!row) continue;
      for (let c = 0; c < row.length - 1; c++) {
        const valA = String(row[c] || "").trim();
        const valB = String(row[c + 1] || "").trim();

        if (
          Object.keys(legendaGuru).length === 0 &&
          valA.match(/^\d+$/) &&
          valB.length > 3 &&
          !valB.match(/\d+[.:-]\d+/) &&
          !valB.match(/^\d+$/)
        ) {
          legendaGuru[valA] = valB;
        } else if (
          Object.keys(legendaMapel).length === 0 &&
          valA.match(/^[A-Za-z]$/) &&
          valB.length > 1 &&
          !valB.match(/^\d+$/)
        ) {
          legendaMapel[valA.toUpperCase()] = valB;
        }
      }
    }
  }

  if (Object.keys(legendaGuru).length === 0) {
    return {
      success: false,
      error: "Tabel Legenda Guru tidak ditemukan dalam sheet Jadwal KBM. Pastikan terdapat tabel dengan kolom 'KODE GURU' dan 'NAMA GURU'.",
      detectedSheets: { ptkSheetName, kbmSheetName },
    };
  }

  // B. Deteksi Baris Header Kelas (Skalabilitas tanpa batas kelas)
  let headerKbmRowIndex = -1;
  const colToKelas: Record<number, string> = {};
  const kelasesList: string[] = [];

  for (let r = 0; r < Math.min(25, dataKbmRaw.length); r++) {
    const row = dataKbmRaw[r];
    if (!row) continue;
    let matchCount = 0;
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || "").trim();
      if (val.match(/^(VII|VIII|IX|X|XI|XII|[7-9]|1[0-2])\s*[-._\s]?\s*([A-Za-z0-9]+)$/i)) {
        matchCount++;
      }
    }
    const rowStr = row.map((c: any) => String(c || "").trim().toLowerCase()).join(" ");
    const hasHeaderIndicators = rowStr.includes("waktu") || rowStr.includes("jam") || rowStr.includes("hari") || rowStr.includes("kelas");

    // Jika dalam baris ini ditemukan minimal 2 kolom berformat kelas, atau minimal 1 kolom kelas bersama penanda waktu/jam/hari
    if (matchCount >= 2 || (matchCount >= 1 && hasHeaderIndicators)) {
      headerKbmRowIndex = r;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || "").trim();
        if (val.match(/^(VII|VIII|IX|X|XI|XII|[7-9]|1[0-2])\s*[-._\s]?\s*([A-Za-z0-9]+)$/i)) {
          const normK = normalizeClassName(val);
          if (!kelasesList.includes(normK)) kelasesList.push(normK);
          colToKelas[c] = normK;
        }
      }
      break;
    }
  }

  if (headerKbmRowIndex === -1 || Object.keys(colToKelas).length === 0) {
    return {
      success: false,
      error: "Baris header daftar kelas (misal: 7A, 8A, 9A, dsb.) tidak ditemukan dalam sheet Jadwal KBM.",
      detectedSheets: { ptkSheetName, kbmSheetName },
    };
  }

  // C. Deteksi Kolom Hari & Waktu
  let dayCol = 0;
  let timeCol = 2;
  for (let c = 0; c < Math.min(6, dataKbmRaw[0]?.length || 6); c++) {
    for (let r = headerKbmRowIndex + 1; r < Math.min(headerKbmRowIndex + 15, dataKbmRaw.length); r++) {
      const cell = String(dataKbmRaw[r]?.[c] || "").trim().toLowerCase();
      if (cell.includes("senin") || cell.includes("selasa")) dayCol = c;
      if (cell.match(/\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2}/)) timeCol = c;
    }
  }

  // D. Ekstraksi dan Konsolidasi Blok Jadwal Mengajar (Block Merging Algorithm)
  const jadwalsList: ParsedData["jadwals"] = [];
  let currentHari = "senin";

  for (const colStr of Object.keys(colToKelas)) {
    const col = parseInt(colStr, 10);
    const kelasNama = colToKelas[col];
    let currentBlock: any = null;

    for (let rowIdx = headerKbmRowIndex + 1; rowIdx < dataKbmRaw.length; rowIdx++) {
      const row = dataKbmRaw[rowIdx];
      if (!row) continue;

      // Update hari jika terdapat pergantian hari pada baris ini
      const hariRaw = String(row[dayCol] || "").trim();
      if (hariRaw) {
        const hLow = hariRaw.toLowerCase();
        if (hLow.includes("senin")) currentHari = "senin";
        else if (hLow.includes("selasa")) currentHari = "selasa";
        else if (hLow.includes("rabu")) currentHari = "rabu";
        else if (hLow.includes("kamis")) currentHari = "kamis";
        else if (hLow.includes("jumat") || hLow.includes("jum'at")) currentHari = "jumat";
        else if (hLow.includes("sabtu")) currentHari = "sabtu";
      }

      // Ambil dan normalisasi waktu
      const jamRaw = String(row[timeCol] || "").trim();
      let jamMulaiStr = "07:00:00";
      let jamSelesaiStr = "14:00:00";
      if (jamRaw && (jamRaw.includes("-") || jamRaw.includes("–"))) {
        const parts = jamRaw.split(/[-–]/).map((s) => s.trim());
        if (parts[0]) jamMulaiStr = normalizeTimeString(parts[0]);
        if (parts[1]) jamSelesaiStr = normalizeTimeString(parts[1]);
      }

      const cellVal = String(row[col] || "").trim();
      const cellClean = cellVal.toLowerCase().replace(/\s+/g, "");
      const isBreakOrEmpty =
        !cellVal ||
        cellVal === "-" ||
        cellClean.includes("istirahat") ||
        cellClean.includes("upacara") ||
        cellClean.includes("literasi") ||
        cellClean.includes("dhuha") ||
        cellClean.includes("senam") ||
        cellClean.includes("kebersihan") ||
        cellClean.includes("keagamaan");

      if (isBreakOrEmpty) {
        if (currentBlock) {
          // Cek apakah jeda ini memotong pelajaran guru & mapel yang sama (jeda istirahat <= 60 menit)
          let willContinueAfterBreak = false;
          for (let lookAheadIdx = rowIdx + 1; lookAheadIdx < dataKbmRaw.length; lookAheadIdx++) {
            const nextRow = dataKbmRaw[lookAheadIdx];
            if (!nextRow) continue;

            const nextHariRaw = String(nextRow[dayCol] || "").trim().toLowerCase();
            if (nextHariRaw) {
              let detectedNextHari = currentHari;
              if (nextHariRaw.includes("senin")) detectedNextHari = "senin";
              else if (nextHariRaw.includes("selasa")) detectedNextHari = "selasa";
              else if (nextHariRaw.includes("rabu")) detectedNextHari = "rabu";
              else if (nextHariRaw.includes("kamis")) detectedNextHari = "kamis";
              else if (nextHariRaw.includes("jumat") || nextHariRaw.includes("jum'at")) detectedNextHari = "jumat";
              else if (nextHariRaw.includes("sabtu")) detectedNextHari = "sabtu";

              if (detectedNextHari !== currentHari) break;
            }

            const nextCellVal = String(nextRow[col] || "").trim();
            const nextCellClean = nextCellVal.toLowerCase().replace(/\s+/g, "");
            const nextIsBreakOrEmpty =
              !nextCellVal ||
              nextCellVal === "-" ||
              nextCellClean.includes("istirahat") ||
              nextCellClean.includes("upacara") ||
              nextCellClean.includes("literasi") ||
              nextCellClean.includes("dhuha") ||
              nextCellClean.includes("senam") ||
              nextCellClean.includes("kebersihan") ||
              nextCellClean.includes("keagamaan");

            if (nextIsBreakOrEmpty) continue;

            const nextMatch = nextCellVal.match(/^(\d+)([a-zA-Z]+)$/);
            if (nextMatch) {
              const nextGuruKode = nextMatch[1];
              const nextMapelKode = nextMatch[2].toUpperCase();

              const nextJamRaw = String(nextRow[timeCol] || "").trim();
              let nextJamMulaiStr = "07:00:00";
              if (nextJamRaw && (nextJamRaw.includes("-") || nextJamRaw.includes("–"))) {
                const p = nextJamRaw.split(/[-–]/).map((s) => s.trim());
                if (p[0]) nextJamMulaiStr = normalizeTimeString(p[0]);
              }

              const [cbH, cbM] = currentBlock.jamSelesai.split(":").map(Number);
              const [nxtH, nxtM] = nextJamMulaiStr.split(":").map(Number);
              const gapMinutes = nxtH * 60 + nxtM - (cbH * 60 + cbM);

              if (
                nextGuruKode === currentBlock.guruKode &&
                nextMapelKode === currentBlock.mapelKode &&
                gapMinutes >= 0 &&
                gapMinutes <= 60
              ) {
                willContinueAfterBreak = true;
              }
            }
            break;
          }

          if (willContinueAfterBreak) continue;

          jadwalsList.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // Parsing kode guru + kode mapel (misal "14G", "25A", "31L")
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
          // Jam pelajaran bersambung, perpanjang jam selesai
          currentBlock.jamSelesai = jamSelesaiStr;
        } else {
          if (currentBlock) jadwalsList.push(currentBlock);
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
    if (currentBlock) jadwalsList.push(currentBlock);
  }

  // ==========================================================================
  // 3. PARSING DINAMIS SHEET DATA GURU
  // ==========================================================================
  const rawPtkGurus: ParsedData["ptk"] = [];

  if (ptkSheetName) {
    const wsPtk = wb.Sheets[ptkSheetName];
    const dataPtkRaw = XLSX.utils.sheet_to_json(wsPtk, { header: 1, defval: "" }) as any[][];

    // Cari baris header guru secara adaptif
    let headerPtkRowIndex = -1;
    for (let i = 0; i < Math.min(25, dataPtkRaw.length); i++) {
      if (!dataPtkRaw[i]) continue;
      const rowStrings = dataPtkRaw[i].map((c: any) => String(c).trim().toLowerCase());
      if (
        rowStrings.some((s) => s === "nama" || s === "nama lengkap" || s === "nama guru") ||
        rowStrings.some((s) => s === "nip" || s === "nuptk")
      ) {
        headerPtkRowIndex = i;
        break;
      }
    }

    if (headerPtkRowIndex !== -1) {
      const headers = dataPtkRaw[headerPtkRowIndex].map((h: any) => String(h).trim().toLowerCase());
      const colNama = headers.findIndex((h: string) => h === "nama" || h === "nama lengkap" || h === "nama guru" || h.includes("nama"));
      const colNip = headers.findIndex((h: string) =>
        h === "nip" || h === "no. nip" || h === "no nip" || h === "nomor nip" || h === "nip/nuptk" || h === "nip / nuptk" || (h.includes("nip") && !h.includes("jenis"))
      );
      const colNuptk = headers.findIndex((h: string) =>
        h === "nuptk" || h === "no. nuptk" || h === "no nuptk" || h === "nomor nuptk" || h.includes("nuptk")
      );
      const colGelarDepan = headers.findIndex((h: string) => h === "gelar depan" || h.includes("gelar depan"));
      const colGelarBelakang = headers.findIndex((h: string) => h === "gelar belakang" || h.includes("gelar belakang"));
      const colNoTelepon = headers.findIndex((h: string) =>
        h === "no hp" || h === "no. hp" || h === "hp" ||
        h === "nomor hp" || h === "no telepon" || h === "nomor telepon" ||
        h === "telepon" || h === "telp" || h === "no telp" || h === "no. telp" ||
        h.includes("telepon") || h.includes("handphone") || (h.includes("hp") && !h.includes("ptk"))
      );
      const colJabatan = headers.findIndex((h: string) =>
        h === "jabatan" || h === "tugas tambahan" || h.includes("tugas tambahan") || (h.includes("jabatan") && !h.includes("ptk"))
      );
      const colJenisPtk = headers.findIndex((h: string) => h === "jenis ptk" || h.includes("jenis ptk"));

      if (colNama !== -1) {
        for (let i = headerPtkRowIndex + 1; i < dataPtkRaw.length; i++) {
          const row = dataPtkRaw[i];
          if (!row || !row[colNama]) continue;

          let namaLengkap = String(row[colNama]).trim();
          if (!namaLengkap || namaLengkap === "-") continue;

          if (colGelarDepan !== -1 && row[colGelarDepan]) {
            const gd = String(row[colGelarDepan]).trim();
            if (gd && gd !== "-") namaLengkap = `${gd} ${namaLengkap}`;
          }

          if (colGelarBelakang !== -1 && row[colGelarBelakang]) {
            const gb = String(row[colGelarBelakang]).trim();
            if (gb && gb !== "-") {
              namaLengkap = namaLengkap.endsWith(",") ? `${namaLengkap} ${gb}` : `${namaLengkap}, ${gb}`;
            }
          }

          let rawNipVal = colNip !== -1 ? String(row[colNip] || "").trim() : "";
          if (rawNipVal === "-" || rawNipVal.toLowerCase() === "null") rawNipVal = "";

          let rawNuptkVal = colNuptk !== -1 ? String(row[colNuptk] || "").trim() : "";
          if (rawNuptkVal === "-" || rawNuptkVal.toLowerCase() === "null") rawNuptkVal = "";

          let rawNoTelepon = colNoTelepon !== -1 ? String(row[colNoTelepon] || "").trim() : "";
          if (rawNoTelepon === "-" || rawNoTelepon === "0") rawNoTelepon = "";

          let rawJabatan = colJabatan !== -1 ? String(row[colJabatan] || "").trim() : "";
          if (!rawJabatan || rawJabatan === "-") rawJabatan = "Guru";

          const jenisPtk = colJenisPtk !== -1 ? String(row[colJenisPtk]).trim() : "Guru";

          rawPtkGurus.push({
            nama: namaLengkap,
            nip: rawNipVal,
            nuptk: rawNuptkVal,
            jenisPtk,
            noTelepon: rawNoTelepon,
            jabatan: rawJabatan,
          });
        }
      }
    }
  }

  // Jika Sheet Guru tidak tersedia, bentuk data guru otomatis dari legenda KBM
  if (rawPtkGurus.length === 0) {
    for (const [kode, nama] of Object.entries(legendaGuru)) {
      rawPtkGurus.push({
        nama,
        nip: "",
        nuptk: "",
        jenisPtk: "Guru",
        jabatan: "Guru",
      });
    }
  }

  // ==========================================================================
  // 4. PEMILAHAN & FILTER GURU AKTIF KBM
  // ==========================================================================
  const activeGuruCodes = new Set(jadwalsList.map((j) => j.guruKode));
  const activeKbmEntries = Object.entries(legendaGuru).filter(([kode]) => activeGuruCodes.has(kode));
  const activeKbmNames = activeKbmEntries.map(([, nama]) => nama);

  const matchedPtkList: ParsedData["ptk"] = [];
  const skippedPtkList: ParsedData["ptk"] = [];

  for (const ptk of rawPtkGurus) {
    const isMatch = activeKbmNames.some((kbmName) => isNameMatch(kbmName, ptk.nama));
    if (isMatch) {
      matchedPtkList.push(ptk);
    } else {
      skippedPtkList.push(ptk);
    }
  }

  // Guru aktif di KBM yang belum tercatat di data guru
  const kbmOnlyList: { kode: string; nama: string }[] = [];
  for (const [kode, nama] of activeKbmEntries) {
    const isInPtk = rawPtkGurus.some((ptk) => isNameMatch(ptk.nama, nama));
    if (!isInPtk) {
      kbmOnlyList.push({ kode, nama });
    }
  }

  return {
    success: true,
    data: {
      ptk: matchedPtkList,
      legendaGuru,
      legendaMapel,
      kelases: kelasesList,
      jadwals: jadwalsList,
    },
    skippedPtkGurus: skippedPtkList,
    kbmOnlyGurus: kbmOnlyList,
    detectedSheets: {
      ptkSheetName,
      kbmSheetName,
    },
  };
}

/**
 * Helper untuk membaca File / ArrayBuffer langsung dari antarmuka browser.
 */
export async function parseExcelWorkbook(fileOrBuffer: File | ArrayBuffer | Uint8Array): Promise<ParsedWorkbookResult> {
  try {
    let buffer: ArrayBuffer;
    if (typeof (fileOrBuffer as File).arrayBuffer === "function") {
      buffer = await (fileOrBuffer as File).arrayBuffer();
    } else {
      buffer = fileOrBuffer as ArrayBuffer;
    }

    const wb = XLSX.read(buffer, { type: "array" });
    return parseExcelWorkbookData(wb);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memproses file Excel workbook.",
    };
  }
}

import * as XLSX from "xlsx-js-style";

const filePath = "c:/Users/bdstd/Downloads/JADWAL KBM - PIKET TA.2026-2027.xlsx";
const wb = XLSX.readFile(filePath);

// Read PTK raw
const wsGuru = wb.Sheets["Data guru"];
const rowsGuru = XLSX.utils.sheet_to_json(wsGuru, { header: 1, defval: "" }) as any[][];

// Titles to strip
const DEGREES = [
  "s.pd.i", "s.pdi", "s.pd", "m.pd.i", "m.pdi", "m.pd",
  "s.si", "m.si", "s.e", "m.e", "se", "s.kom", "m.kom",
  "s.ag", "m.ag", "s.m", "m.m", "a.md", "amd", "s.sos",
  "m.sos", "s.sn", "s.t", "m.t", "s.h", "drs", "dra", "dr",
  "prof", "ir", "h", "hj", "kh"
];

function smartCleanName(name: string): string {
  if (!name) return "";
  let clean = name.toLowerCase();

  // Remove common punctuation except spaces
  clean = clean.replace(/[,.]/g, " ");

  // Tokenize and filter out degree words
  const tokens = clean.split(/\s+/).filter(Boolean);
  const filteredTokens = tokens.filter((t) => !DEGREES.includes(t));

  return filteredTokens.join(" ").trim();
}

function smartNameMatch(nameA: string, nameB: string): boolean {
  const cleanA = smartCleanName(nameA);
  const cleanB = smartCleanName(nameB);

  if (cleanA === cleanB) return true;

  const tokensA = cleanA.split(/\s+/).filter(Boolean);
  const tokensB = cleanB.split(/\s+/).filter(Boolean);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // First name match or initial
  const firstA = tokensA[0];
  const firstB = tokensB[0];
  const matchFirst = firstA === firstB || (firstA.length === 1 && firstB.startsWith(firstA)) || (firstB.length === 1 && firstA.startsWith(firstB));

  if (!matchFirst) return false;

  // If both have more tokens, check if subsequent tokens match
  for (let i = 1; i < Math.min(tokensA.length, tokensB.length); i++) {
    const tA = tokensA[i];
    const tB = tokensB[i];
    if (!tA.startsWith(tB) && !tB.startsWith(tA)) {
      return false;
    }
  }

  return true;
}

// Read KBM Legenda
const wsKbm = wb.Sheets["JADWAL KBM"];
const rowsKbm = XLSX.utils.sheet_to_json(wsKbm, { header: 1, defval: "" }) as any[][];

let legendaGuru: Record<string, string> = {};
let anchor: { r: number; c: number } | null = null;
for (let r = 0; r < rowsKbm.length; r++) {
  for (let c = 0; c < (rowsKbm[r] || []).length; c++) {
    const txt = String(rowsKbm[r][c] || "").toLowerCase().trim();
    if (txt.includes("kode guru") || txt.includes("legenda guru")) {
      anchor = { r, c };
      break;
    }
  }
  if (anchor) break;
}

if (anchor) {
  for (let r = anchor.r + 1; r < rowsKbm.length; r++) {
    const row = rowsKbm[r];
    if (!row) continue;
    const codeVal = String(row[anchor.c] || "").trim();
    const nameVal = String(row[anchor.c + 1] || "").trim();
    if (codeVal.match(/^\d+$/) && nameVal.length > 0 && !nameVal.match(/^\d+$/)) {
      legendaGuru[codeVal] = nameVal;
    }
  }
}

// Collect Data Guru names
const ptkNames: { raw: string; cleaned: string }[] = [];
for (let i = 1; i < rowsGuru.length; i++) {
  const r = rowsGuru[i];
  if (r[0]) {
    ptkNames.push({
      raw: String(r[0]),
      cleaned: smartCleanName(String(r[0])),
    });
  }
}

console.log("=== MATCHING RESULTS ===");
let matchedCount = 0;
let unmatchedKbm: string[] = [];

for (const [kode, kbmName] of Object.entries(legendaGuru)) {
  const match = ptkNames.find((ptk) => smartNameMatch(ptk.raw, kbmName));
  if (match) {
    matchedCount++;
    console.log(`[MATCH] Code ${kode}: "${kbmName}" <===> "${match.raw}"`);
  } else {
    unmatchedKbm.push(`${kode}: ${kbmName}`);
    console.log(`[NOT MATCHED] Code ${kode}: "${kbmName}"`);
  }
}

console.log(`\nMatched: ${matchedCount} / ${Object.keys(legendaGuru).length}`);
console.log("Unmatched KBM teachers (really not in Data Guru):", unmatchedKbm);


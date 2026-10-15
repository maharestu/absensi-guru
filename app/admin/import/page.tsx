"use client";

import React, { useState } from "react";
import { ClockBadges } from "@/components/admin/ui/ClockBadges";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, X, Sparkles } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { importExcelData, ParsedData } from "@/actions/import";
import { parseExcelWithAIAction, AIImportSummary } from "@/actions/ai-import";

export default function ImportDataPage() {
  const [filePtk, setFilePtk] = useState<File | null>(null);
  const [fileKbm, setFileKbm] = useState<File | null>(null);

  const [importMode, setImportMode] = useState<"template" | "ai">("template");

  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [aiSummary, setAiSummary] = useState<AIImportSummary | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ptk' | 'kbm') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'ptk') setFilePtk(e.target.files[0]);
      if (type === 'kbm') setFileKbm(e.target.files[0]);
      setImportSuccess(false);
      setImportError("");
    }
  };

  const processBothFiles = async () => {
    if (!filePtk || !fileKbm) {
      setImportError("Harap unggah kedua file (Data PTK dan Data Jadwal KBM) terlebih dahulu.");
      return;
    }

    setIsParsing(true);
    setImportSuccess(false);
    setImportError("");

    try {
      if (importMode === "ai") {
        // --- 1. PROSES DENGAN AI (CADANGAN / FLEKSIBEL) ---
        const bufferPtk = await filePtk.arrayBuffer();
        const wbPtk = XLSX.read(bufferPtk, { type: "array" });
        const sheetPtkName = wbPtk.SheetNames.find((s: string) => s.toLowerCase() === "ptk" || s.toLowerCase().includes("ptk")) || wbPtk.SheetNames[0];
        const dataPtkRaw = XLSX.utils.sheet_to_json(wbPtk.Sheets[sheetPtkName], { header: 1, defval: "" }) as any[][];

        const bufferKbm = await fileKbm.arrayBuffer();
        const wbKbm = XLSX.read(bufferKbm, { type: "array" });
        const sheetKbmName = wbKbm.SheetNames.find((s: string) => s.toLowerCase() === "jadwal kbm" || s.toLowerCase().includes("kbm") || s.toLowerCase().includes("jadwal")) || wbKbm.SheetNames[0];
        const dataKbmRaw = XLSX.utils.sheet_to_json(wbKbm.Sheets[sheetKbmName], { header: 1, defval: "" }) as any[][];

        const res = await parseExcelWithAIAction(dataPtkRaw, dataKbmRaw);
        if (!res.success || !res.data) {
          throw new Error(res.error || "Gagal memproses file dengan AI.");
        }

        setParsedData(res.data);
        setAiSummary(res.summary ?? null);
        return;
      }

      // --- 2. PROSES DENGAN TEMPLATE STANDAR SMPN 8 (LOKAL) ---
      const bufferPtk = await filePtk.arrayBuffer();
      const wbPtk = XLSX.read(bufferPtk, { type: "array" });
      const sheetPtkName = wbPtk.SheetNames.find((s: string) => s.toLowerCase() === "ptk" || s.toLowerCase().includes("ptk")) || wbPtk.SheetNames[0];
      const dataPtkRaw = XLSX.utils.sheet_to_json(wbPtk.Sheets[sheetPtkName], { header: 1, defval: "" }) as any[][];

      // Cari baris header
      let headerRowIndex = -1;
      for (let i = 0; i < 20; i++) {
        if (!dataPtkRaw[i]) continue;
        const rowStrings = dataPtkRaw[i].map((c: any) => String(c).trim().toLowerCase());
        if (rowStrings.includes("nama") || rowStrings.includes("nip")) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) throw new Error("Format file PTK tidak dikenali (Tidak ada kolom Nama/NIP).");

      const headers = dataPtkRaw[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
      const colNama = headers.indexOf("nama");
      const colNip = headers.indexOf("nip");
      const colNuptk = headers.indexOf("nuptk");
      const colJenisPtk = headers.indexOf("jenis ptk");
      const colGelarDepan = headers.indexOf("gelar depan");
      const colGelarBelakang = headers.indexOf("gelar belakang");

      const ptkList: ParsedData["ptk"] = [];

      for (let i = headerRowIndex + 1; i < dataPtkRaw.length; i++) {
        const row = dataPtkRaw[i];
        if (!row || !row[colNama]) continue;
        const jenisPtk = colJenisPtk !== -1 ? String(row[colJenisPtk]).trim() : "Guru";

        if (jenisPtk.toLowerCase().includes("guru")) {
          let namaLengkap = String(row[colNama]).trim();

          if (colGelarDepan !== -1 && row[colGelarDepan]) {
            const gd = String(row[colGelarDepan]).trim();
            if (gd && gd !== "-") namaLengkap = `${gd} ${namaLengkap}`;
          }

          if (colGelarBelakang !== -1 && row[colGelarBelakang]) {
            const gb = String(row[colGelarBelakang]).trim();
            if (gb && gb !== "-") {
              if (namaLengkap.endsWith(",")) {
                namaLengkap = `${namaLengkap} ${gb}`;
              } else {
                namaLengkap = `${namaLengkap}, ${gb}`;
              }
            }
          }

          ptkList.push({
            nama: namaLengkap,
            nip: colNip !== -1 ? String(row[colNip]).trim() : "",
            nuptk: colNuptk !== -1 ? String(row[colNuptk]).trim() : "",
            jenisPtk
          });
        }
      }

      // PROSES FILE JADWAL KBM
      const bufferKbm = await fileKbm.arrayBuffer();
      const wbKbm = XLSX.read(bufferKbm, { type: "array" });
      const sheetKbmName = wbKbm.SheetNames.find((s: string) => s.toLowerCase() === "jadwal kbm" || s.toLowerCase().includes("kbm") || s.toLowerCase().includes("jadwal")) || wbKbm.SheetNames[0];
      const dataKbmRaw = XLSX.utils.sheet_to_json(wbKbm.Sheets[sheetKbmName], { header: 1, defval: "" }) as any[][];

      const legendaGuru: Record<string, string> = {};
      const legendaMapel: Record<string, string> = {};

      for (let i = 0; i < dataKbmRaw.length; i++) {
        const row = dataKbmRaw[i];
        if (row && row[26] && row[27] && String(row[26]).trim() !== "") {
          const kode = String(row[26]).trim();
          const nama = String(row[27]).trim();
          if (kode.match(/^\d+$/)) {
            legendaGuru[kode] = nama;
          } else if (kode.match(/^[a-zA-Z]$/)) {
            legendaMapel[kode.toUpperCase()] = nama;
          }
        }
      }

      // Deteksi baris header kelas (misal baris yang memuat 7A, 8A, 9A)
      let headerKbmRowIndex = 5;
      for (let i = 0; i < Math.min(15, dataKbmRaw.length); i++) {
        if (!dataKbmRaw[i]) continue;
        const str = dataKbmRaw[i].map((c: any) => String(c).trim()).join(" ");
        if (str.includes("7A") || str.includes("8A") || str.includes("9A")) {
          headerKbmRowIndex = i;
          break;
        }
      }

      const kelasRow = dataKbmRaw[headerKbmRowIndex];
      const kelasesList: string[] = [];
      const colToKelas: Record<number, string> = {};
      if (kelasRow) {
        for (let col = 3; col < kelasRow.length; col++) {
          const namaKelas = String(kelasRow[col]).trim();
          if (namaKelas && (namaKelas.startsWith("7") || namaKelas.startsWith("8") || namaKelas.startsWith("9"))) {
            if (!kelasesList.includes(namaKelas)) {
              kelasesList.push(namaKelas);
            }
            colToKelas[col] = namaKelas;
          }
        }
      }

      // ALGORITMA BLOCK MERGING (Sintesis Blok Jadwal Mengajar)
      const jadwalsList: ParsedData["jadwals"] = [];
      let currentHari = "senin";

      for (const colStr of Object.keys(colToKelas)) {
        const col = parseInt(colStr, 10);
        const kelasNama = colToKelas[col];
        let currentBlock: any = null;

        for (let rowIdx = headerKbmRowIndex + 1; rowIdx < dataKbmRaw.length; rowIdx++) {
          const row = dataKbmRaw[rowIdx];
          if (!row) continue;

          const hariRaw = String(row[0]).trim();
          if (hariRaw) {
            if (hariRaw.toLowerCase().includes("senin")) currentHari = "senin";
            else if (hariRaw.toLowerCase().includes("selasa")) currentHari = "selasa";
            else if (hariRaw.toLowerCase().includes("rabu")) currentHari = "rabu";
            else if (hariRaw.toLowerCase().includes("kamis")) currentHari = "kamis";
            else if (hariRaw.toLowerCase().includes("jumat") || hariRaw.toLowerCase().includes("jum'at")) currentHari = "jumat";
          }

          const jamRaw = String(row[2]).trim();
          let jamMulaiStr = "07:00:00";
          let jamSelesaiStr = "14:00:00";
          if (jamRaw && jamRaw.includes("-")) {
            const parts = jamRaw.split("-").map((s) => s.trim().replace(".", ":"));
            if (parts[0]) jamMulaiStr = parts[0].length === 5 ? parts[0] + ":00" : parts[0];
            if (parts[1]) jamSelesaiStr = parts[1].length === 5 ? parts[1] + ":00" : parts[1];
          }

          const cellVal = String(row[col]).trim();
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

      // Hitung total guru unik dari KEDUA file (PTK + Legenda KBM)
      const ptkNames = ptkList.map(p => p.nama.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const kbmTeacherNames = Object.values(legendaGuru);
      let extraKbm = 0;
      for (const kn of kbmTeacherNames) {
        const cleanK = kn.split(",")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = ptkNames.some(pn => pn === cleanK || pn.includes(cleanK) || cleanK.includes(pn));
        if (!match) extraKbm++;
      }

      const summary: AIImportSummary = {
        totalPtkGuru: ptkList.length,
        totalKbmGuru: kbmTeacherNames.length,
        extraKbmGuru: extraKbm,
        totalGuruCombined: ptkList.length + extraKbm,
        totalKelas: kelasesList.length,
        totalJadwalBlok: jadwalsList.length,
        totalMapel: Object.keys(legendaMapel).length,
      };

      setAiSummary(summary);
      setParsedData({
        ptk: ptkList,
        legendaGuru,
        legendaMapel,
        kelases: kelasesList,
        jadwals: jadwalsList
      });

    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Gagal memproses file Excel.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setIsImporting(true);
    setImportError("");
    setImportSuccess(false);

    try {
      const result = await importExcelData(parsedData);
      if (result.success) {
        setImportSuccess(true);
        setParsedData(null);
        setAiSummary(null);
        setFilePtk(null);
        setFileKbm(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setImportError(err.message || "Gagal menyimpan data ke database.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Import Data Ganda
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unggah File PTK dan File Jadwal KBM untuk sinkronisasi data sekolah secara otomatis.
          </p>
        </div>

        <ClockBadges />
      </div>

      {/* ── UPLOAD AREA ── */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
          
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pilih Metode Analisis</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan Import Standar untuk template resmi SMPN 8 (instan & presisi 100%), atau gunakan AI sebagai cadangan jika tata letak berkas berbeda.
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setImportMode("template")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importMode === "template"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                Import Standar (Utama)
                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-0.5">Rekomendasi</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode("ai")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  importMode === "ai"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Import AI (Cadangan)
                <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-0.5">Fleksibel</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Upload PTK */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">1. Data Profil Guru / PTK (Excel / CSV)</h3>
              <p className="text-[13px] text-slate-500 mt-0.5 mb-3">Pilih file data guru yang ingin diimpor. Format kolom akan disesuaikan otomatis.</p>

              <div className="relative w-full h-[180px] rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center transition-all group">
                <input
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileChange(e, 'ptk')}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {filePtk ? (
                    <FileSpreadsheet className="w-10 h-10 mb-3 text-blue-600" strokeWidth={1.5} />
                  ) : (
                    <UploadCloud className="w-10 h-10 mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                  )}
                  <p className="text-[15px] font-bold text-slate-900">{filePtk ? filePtk.name : "Upload file ke sini"}</p>
                  {!filePtk && <p className="text-[13px] text-slate-400 mt-1">.csv, .xls, .xlsx • Maks. 10 MB</p>}
                </div>
              </div>
            </div>

            {/* Upload Jadwal */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">2. Data Jadwal KBM (Excel / CSV)</h3>
              <p className="text-[13px] text-slate-500 mt-0.5 mb-3">Pilih file Jadwal KBM yang ingin diimpor. Format kolom dan legenda akan dipetakan otomatis.</p>

              <div className="relative w-full h-[180px] rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center transition-all group">
                <input
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileChange(e, 'kbm')}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {fileKbm ? (
                    <FileSpreadsheet className="w-10 h-10 mb-3 text-blue-600" strokeWidth={1.5} />
                  ) : (
                    <UploadCloud className="w-10 h-10 mb-3 text-blue-600 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                  )}
                  <p className="text-[15px] font-bold text-slate-900">{fileKbm ? fileKbm.name : "Upload file ke sini"}</p>
                  {!fileKbm && <p className="text-[13px] text-slate-400 mt-1">.csv, .xls, .xlsx • Maks. 10 MB</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={processBothFiles}
              disabled={isParsing || !filePtk || !fileKbm}
              className={`px-6 h-12 text-white text-sm font-bold rounded-xl flex items-center justify-center transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${
                importMode === "ai"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 disabled:from-slate-300 disabled:to-slate-300"
                  : "bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300"
              }`}
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {importMode === "ai" ? "AI Sedang Menganalisis..." : "Memproses File..."}
                </>
              ) : (
                <>
                  {importMode === "ai" ? <Sparkles className="w-5 h-5 mr-2" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                  {importMode === "ai" ? "Proses File dengan AI Cerdas" : "Proses File (Template Standar)"}
                </>
              )}
            </button>
          </div>

          {importError && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
              <X className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">{importError}</p>
            </div>
          )}

          {importSuccess && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">Kedua data berhasil diproses dan disinkronisasi ke database secara massal.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL OVERLAY (RINGKASAN ANALISIS DARI KEDUA FILE) ── */}
      {parsedData && !importSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setParsedData(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-[520px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between p-6 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">Ringkasan Analisis Data</h3>
                  {importMode === "ai" && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Cerdas
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-slate-500 mt-1">Periksa hasil penyatuan jadwal dan total guru dari kedua file sebelum import.</p>
              </div>
              <button onClick={() => setParsedData(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 pt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                {/* Total Guru Gabungan Kedua File (Sesuai Permintaan User) */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">TOTAL GURU (KEDUA FILE)</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {aiSummary?.totalGuruCombined ?? parsedData.ptk.length}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {parsedData.ptk.length} dari PTK • {aiSummary?.extraKbmGuru ?? 0} dari Jadwal KBM
                  </p>
                </div>

                {/* Total Ruang Kelas */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">RUANG KELAS</p>
                  <p className="text-2xl font-bold text-slate-900">{parsedData.kelases.length}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Kelas terdeteksi</p>
                </div>

                {/* Total Blok Jadwal KBM */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">BLOK JADWAL KBM</p>
                  <p className="text-2xl font-bold text-blue-600">{parsedData.jadwals.length}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Jam berurutan telah disatukan</p>
                </div>

                {/* Total Mata Pelajaran */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">MATA PELAJARAN</p>
                  <p className="text-2xl font-bold text-slate-900">{Object.keys(parsedData.legendaMapel).length}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Mata pelajaran terdaftar</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="px-5 h-12 border border-slate-200 text-slate-700 text-[14px] font-bold rounded-[14px] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 text-white text-[15px] font-bold rounded-[14px] flex items-center justify-center transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {isImporting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Menyimpan...</> : "Eksekusi Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Clock, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, X } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { importExcelData, ParsedData } from "@/actions/import";

export default function ImportDataPage() {
  const { timeString } = useRealtimeClock();
  
  const [filePtk, setFilePtk] = useState<File | null>(null);
  const [fileKbm, setFileKbm] = useState<File | null>(null);

  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
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
      // --- 1. PROSES FILE PTK ---
      const bufferPtk = await filePtk.arrayBuffer();
      const wbPtk = XLSX.read(bufferPtk, { type: "array" });
      const sheetPtkName = wbPtk.SheetNames.includes("PTK") ? "PTK" : wbPtk.SheetNames[0];
      const dataPtkRaw = XLSX.utils.sheet_to_json(wbPtk.Sheets[sheetPtkName], { header: 1, defval: "" });

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

      const ptkList: ParsedData["ptk"] = [];
      
      for (let i = headerRowIndex + 1; i < dataPtkRaw.length; i++) {
        const row = dataPtkRaw[i];
        if (!row || !row[colNama]) continue;
        const jenisPtk = colJenisPtk !== -1 ? String(row[colJenisPtk]).trim() : "Guru"; // Default Guru jika tak ada kolom
        
        if (jenisPtk.toLowerCase().includes("guru")) {
          ptkList.push({
            nama: String(row[colNama]).trim(),
            nip: colNip !== -1 ? String(row[colNip]).trim() : "",
            nuptk: colNuptk !== -1 ? String(row[colNuptk]).trim() : "",
            jenisPtk
          });
        }
      }

      // --- 2. PROSES FILE JADWAL KBM ---
      const bufferKbm = await fileKbm.arrayBuffer();
      const wbKbm = XLSX.read(bufferKbm, { type: "array" });
      if (!wbKbm.SheetNames.includes("JADWAL KBM")) {
        throw new Error("Sheet 'JADWAL KBM' tidak ditemukan pada file kedua.");
      }
      const dataKbmRaw = XLSX.utils.sheet_to_json(wbKbm.Sheets["JADWAL KBM"], { header: 1, defval: "" });

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

      const kelasRow = dataKbmRaw[5]; 
      const kelasesList: string[] = [];
      const colToKelas: Record<number, string> = {};
      if (kelasRow) {
        for (let col = 3; col <= 25; col++) {
          const namaKelas = String(kelasRow[col]).trim();
          if (namaKelas) {
            kelasesList.push(namaKelas);
            colToKelas[col] = namaKelas;
          }
        }
      }

      // --- 3. ALGORITMA BLOCK MERGING ---
      const jadwalsList: ParsedData["jadwals"] = [];
      let currentHari = "Senin";
      
      // Kita susuri per kolom kelas, lalu per baris (vertikal)
      for (let col = 3; col <= 25; col++) {
        if (!colToKelas[col]) continue;
        const kelasNama = colToKelas[col];
        
        let currentBlock: any = null;

        for (let rowIdx = 7; rowIdx < dataKbmRaw.length; rowIdx++) {
          const row = dataKbmRaw[rowIdx];
          if (!row) continue;

          // Update hari (kolom 0)
          const hariRaw = String(row[0]).trim();
          if (hariRaw) {
            if (hariRaw.toLowerCase().includes("senin")) currentHari = "senin";
            else if (hariRaw.toLowerCase().includes("selasa")) currentHari = "selasa";
            else if (hariRaw.toLowerCase().includes("rabu")) currentHari = "rabu";
            else if (hariRaw.toLowerCase().includes("kamis")) currentHari = "kamis";
            else if (hariRaw.toLowerCase().includes("jumat") || hariRaw.toLowerCase().includes("jum'at")) currentHari = "jumat";
          }

          const jamRaw = String(row[2]).trim();
          let jamMulaiStr = "00:00:00";
          let jamSelesaiStr = "23:59:00";
          if (jamRaw && jamRaw.includes("-")) {
            const parts = jamRaw.split("-").map(s => s.trim().replace(".", ":"));
            if (parts[0]) jamMulaiStr = parts[0].length === 5 ? parts[0] + ":00" : parts[0];
            if (parts[1]) jamSelesaiStr = parts[1].length === 5 ? parts[1] + ":00" : parts[1];
          }

          const cellVal = String(row[col]).trim();
          
          if (!cellVal || cellVal === "-" || cellVal.toLowerCase().includes("istirahat")) {
            // Putus blok
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

            if (currentBlock && currentBlock.guruKode === guruKode && currentBlock.mapelKode === mapelKode && currentBlock.hari === currentHari) {
              // Lanjutkan blok (merge jam selesai)
              currentBlock.jamSelesai = jamSelesaiStr;
            } else {
              // Simpan blok lama
              if (currentBlock) {
                jadwalsList.push(currentBlock);
              }
              // Mulai blok baru
              currentBlock = {
                guruKode,
                mapelKode,
                kelasNama,
                hari: currentHari,
                jamMulai: jamMulaiStr,
                jamSelesai: jamSelesaiStr
              };
            }
          } else {
             // Nilai lain (misal UPACARA), putus blok
             if (currentBlock) {
              jadwalsList.push(currentBlock);
              currentBlock = null;
            }
          }
        }
        // Simpan sisa blok di akhir baris
        if (currentBlock) {
          jadwalsList.push(currentBlock);
        }
      }

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
            Unggah File PTK dan File Jadwal KBM untuk sinkronisasi data sekolah.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Clock className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>
        </div>
      </div>

      {/* ── UPLOAD AREA ── */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Unggah 2 Berkas (Wajib)</h2>
          
          <div className="flex flex-col gap-8">
            {/* Upload PTK */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">1. Data Profil PTK (Excel)</h3>
              <p className="text-[13px] text-slate-500 mt-0.5 mb-3">Pilih file data guru yang ingin diimpor. Pastikan format file sesuai dengan ketentuan.</p>
              
              <div className="relative w-full h-[200px] rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center transition-all group">
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
              <h3 className="text-[16px] font-bold text-slate-900">2. Data Jadwal KBM (Excel)</h3>
              <p className="text-[13px] text-slate-500 mt-0.5 mb-3">Pilih file Jadwal KBM yang ingin diimpor. Pastikan format file sesuai dengan ketentuan.</p>
              
              <div className="relative w-full h-[200px] rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center transition-all group">
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
              className="px-6 h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl flex items-center justify-center transition-all shadow-md"
            >
              {isParsing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UploadCloud className="w-5 h-5 mr-2" />}
              Proses File
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

      {/* ── MODAL OVERLAY (PREVIEW) ── */}
      {parsedData && !importSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setParsedData(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between p-6 pb-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ringkasan Analisis Data</h3>
                <p className="text-[13px] text-slate-500 mt-1">Periksa hasil penyatuan jadwal (Block Scheduling) sebelum import.</p>
              </div>
              <button onClick={() => setParsedData(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 pt-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">GURU (DARI PTK)</p>
                  <p className="text-lg font-bold text-slate-900">{parsedData.ptk.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">RUANG KELAS</p>
                  <p className="text-lg font-bold text-slate-900">{parsedData.kelases.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">BLOK JADWAL KBM</p>
                  <p className="text-lg font-bold text-blue-600">{parsedData.jadwals.length}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Jam berurutan telah disatukan</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">MATA PELAJARAN</p>
                  <p className="text-lg font-bold text-slate-900">{Object.keys(parsedData.legendaMapel).length}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 text-white text-[15px] font-bold rounded-[14px] flex items-center justify-center transition-all shadow-md shadow-blue-500/20"
                >
                  {isImporting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading...</> : "Eksekusi Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

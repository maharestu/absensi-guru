"use client";

import React, { useState, useRef } from "react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Clock, Calendar, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, X, FileText, Database } from "lucide-react";
import * as XLSX from "xlsx";
import { importExcelData } from "@/actions/import";

type ParsedData = {
  gurus: { nip: string; nama: string; kode: string }[];
  kelases: { nama_kelas: string }[];
  jadwals: {
    guruKode: string;
    kelasNama: string;
    mataPelajaran: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
  }[];
};

export default function ImportDataPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setImportSuccess(false);
    setImportError("");
    setParsedData(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = "JADWAL KBM";

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" tidak ditemukan. Pastikan format Excel sesuai.`);
      }

      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });

      // 1. Ekstrak Data Guru & Mapel
      const gurus: { nip: string; nama: string; kode: string }[] = [];
      const mapelMap: Record<string, string> = {};

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row[26] && row[27] && String(row[26]).trim() !== "") {
          const kode = String(row[26]).trim();
          const namaAtauMapel = String(row[27]).trim();

          if (kode.match(/^\d+$/)) {
            const nip = `NIP-TBD-${Math.floor(Math.random() * 1000000)}-${kode}`;
            gurus.push({ nip, nama: namaAtauMapel, kode });
          } else if (kode.match(/^[a-zA-Z]$/)) {
            mapelMap[kode.toUpperCase()] = namaAtauMapel;
          }
        }
      }

      // 2. Ekstrak Data Kelas
      const kelasRow = rawData[5]; // Baris 6 (index 5)
      const kelases: { nama_kelas: string }[] = [];
      const colToKelas: Record<number, string> = {};
      if (kelasRow) {
        for (let col = 3; col <= 25; col++) {
          const namaKelas = String(kelasRow[col]).trim();
          if (namaKelas) {
            kelases.push({ nama_kelas: namaKelas });
            colToKelas[col] = namaKelas;
          }
        }
      }

      // 3. Ekstrak Jadwal Mengajar
      const jadwals: ParsedData["jadwals"] = [];
      let currentHari = "Senin";

      for (let i = 7; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row) continue;

        const hariRaw = String(row[0]).trim();
        if (hariRaw) {
          // Normalisasi Hari
          if (hariRaw.toLowerCase().includes("senin")) currentHari = "senin";
          else if (hariRaw.toLowerCase().includes("selasa")) currentHari = "selasa";
          else if (hariRaw.toLowerCase().includes("rabu")) currentHari = "rabu";
          else if (hariRaw.toLowerCase().includes("kamis")) currentHari = "kamis";
          else if (hariRaw.toLowerCase().includes("jumat") || hariRaw.toLowerCase().includes("jum'at")) currentHari = "jumat";
        }

        const jamRaw = String(row[2]).trim(); // Waktu e.g. '07.30-08.10'

        let jamMulaiStr = "00:00:00";
        let jamSelesaiStr = "23:59:00";

        if (jamRaw && jamRaw.includes("-")) {
          const parts = jamRaw.split("-").map(s => s.trim().replace(".", ":"));
          if (parts[0]) {
            jamMulaiStr = parts[0];
            if (jamMulaiStr.length === 5) jamMulaiStr += ":00";
          }
          if (parts[1]) {
            jamSelesaiStr = parts[1];
            if (jamSelesaiStr.length === 5) jamSelesaiStr += ":00";
          }
        }

        // Iterasi kolom kelas
        for (let col = 3; col <= 25; col++) {
          const cellVal = String(row[col]).trim();
          if (cellVal && colToKelas[col]) {
            // Contoh cellVal = '14G' -> Guru 14, Mapel G
            // Pisahkan angka dan huruf
            const match = cellVal.match(/^(\d+)([a-zA-Z]+)$/);
            if (match) {
              const guruKode = match[1];
              const mapelKode = match[2].toUpperCase();

              const mapelNama = mapelMap[mapelKode] || mapelKode;

              jadwals.push({
                guruKode,
                mataPelajaran: mapelNama,
                kelasNama: colToKelas[col],
                hari: currentHari,
                jamMulai: jamMulaiStr,
                jamSelesai: jamSelesaiStr,
              });
            }
          }
        }
      }

      setParsedData({ gurus, kelases, jadwals });
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Gagal memproses file Excel.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
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
        setFile(null);
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
            Import Data
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unggah file CSV, Excel (.xls), atau XLSX untuk memperbarui data secara massal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Clock className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Calendar className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>
        </div>
      </div>

      {/* ── UPLOAD AREA ── */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Unggah Berkas</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Pilih file yang ingin diimpor. Pastikan format file sesuai dengan ketentuan.
          </p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full h-[320px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center pointer-events-none">
              {isParsing ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              ) : (
                <div className="w-16 h-16 mb-4 flex items-center justify-center text-blue-600">
                  <UploadCloud className="w-12 h-12" strokeWidth={1.5} />
                </div>
              )}

              <p className="text-base font-bold text-slate-900">
                {isParsing ? "Memproses File..." : (file ? file.name : "Upload file ke sini")}
              </p>
              {!isParsing && !file && (
                <p className="text-sm font-medium text-slate-400 mt-1">
                  .csv, .xls, .xlsx • Maks. 10 MB
                </p>
              )}
            </div>
          </div>

          {importError && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm font-medium leading-relaxed">{importError}</p>
            </div>
          )}

          {importSuccess && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-600">
              <CheckCircle2 width="20" height="20" className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">Data berhasil diimpor dan disimpan ke database secara massal.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL OVERLAY ── */}
      {parsedData && file && !importSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setParsedData(null); setFile(null); }}
          ></div>

          <div className="relative bg-white rounded-3xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Detail File yang Diunggah</h3>
                <p className="text-[13px] text-slate-500 mt-1">Periksa kembali data sebelum melakukan import.</p>
              </div>
              <button
                onClick={() => { setParsedData(null); setFile(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-2 space-y-5">
              {/* Card File Icon */}
              <div className="mx-auto max-w-[300px] w-full rounded-[20px] border border-slate-200/80 bg-white shadow-sm flex flex-col items-center p-8 relative">
                <FileText className="w-12 h-12 text-slate-700 mb-4" strokeWidth={1.2} />
                <p className="text-[14px] font-bold text-slate-900 text-center leading-snug mb-5 line-clamp-2">
                  {file.name}
                </p>
                <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-blue-600">
                  <span className="flex items-center gap-1.5 bg-blue-50/50 px-2.5 py-1 rounded-md">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    .xlsx
                  </span>
                  <span className="flex items-center gap-1.5 bg-blue-50/50 px-2.5 py-1 rounded-md">
                    <Database className="w-3.5 h-3.5" />
                    {Math.round(file.size / 1024)} KB
                  </span>
                </div>
              </div>

              {/* Ringkasan Data */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">TOTAL GURU</p>
                  <p className="text-lg font-bold text-slate-900">{parsedData.gurus.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">RUANG KELAS</p>
                  <p className="text-lg font-bold text-slate-900">{parsedData.kelases.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">JADWAL KBM</p>
                  <p className="text-lg font-bold text-slate-900">{parsedData.jadwals.length}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500">MATA PELAJARAN</p>
                  <p className="text-lg font-bold text-slate-900">{new Set(parsedData.jadwals.map(j => j.mataPelajaran)).size}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 disabled:active:scale-100 text-white text-[15px] font-bold rounded-[14px] flex items-center justify-center transition-all cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Import"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

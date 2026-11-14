"use client";

import React, { useState } from "react";
import { ClockBadges } from "@/components/admin/ui/ClockBadges";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Info,
  FileCheck
} from "lucide-react";
import { importExcelData, ParsedData } from "@/actions/import";
import { parseExcelWorkbook } from "@/lib/excel-parser";

export default function ImportDataPage() {
  const [fileWorkbook, setFileWorkbook] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [skippedPtkGurus, setSkippedPtkGurus] = useState<ParsedData["ptk"]>([]);
  const [selectedExtraPtkNames, setSelectedExtraPtkNames] = useState<string[]>([]);
  const [kbmOnlyGurus, setKbmOnlyGurus] = useState<{ kode: string; nama: string }[]>([]);
  const [showSkippedAccordion, setShowSkippedAccordion] = useState(false);

  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState<any>(null);
  const [importError, setImportError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileWorkbook(e.target.files[0]);
      setParsedData(null);
      setImportSuccess(false);
      setImportStats(null);
      setImportError("");
    }
  };

  const handleRemoveFile = () => {
    setFileWorkbook(null);
    setParsedData(null);
    setImportSuccess(false);
    setImportStats(null);
    setImportError("");
  };

  const toggleExtraPtk = (nama: string) => {
    setSelectedExtraPtkNames((prev) =>
      prev.includes(nama) ? prev.filter((n) => n !== nama) : [...prev, nama]
    );
  };

  const processWorkbookFile = async () => {
    if (!fileWorkbook) {
      setImportError("Harap pilih atau unggah file Excel workbook terlebih dahulu.");
      return;
    }

    setIsParsing(true);
    setImportSuccess(false);
    setImportStats(null);
    setImportError("");

    try {
      const result = await parseExcelWorkbook(fileWorkbook);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal memproses file Excel workbook.");
      }

      setParsedData(result.data);
      setSkippedPtkGurus(result.skippedPtkGurus || []);
      setKbmOnlyGurus(result.kbmOnlyGurus || []);
      setSelectedExtraPtkNames([]);
      setShowSkippedAccordion(false);
    } catch (err: any) {
      console.error("Kesalahan parsing:", err);
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
    setImportStats(null);

    try {
      // Gabungkan guru aktif KBM dari PTK dengan guru non-KBM yang dipilih admin (jika ada)
      const extraPtks = skippedPtkGurus.filter((p) => selectedExtraPtkNames.includes(p.nama));
      const finalPtkList = [...parsedData.ptk, ...extraPtks];

      const result = await importExcelData({
        ...parsedData,
        ptk: finalPtkList,
      });

      if (result.success) {
        setImportSuccess(true);
        setImportStats(result.stats || null);
        setParsedData(null);
        setSkippedPtkGurus([]);
        setSelectedExtraPtkNames([]);
        setKbmOnlyGurus([]);
        setFileWorkbook(null);
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
            Import Jadwal & Data Guru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unggah satu file Excel workbook terpadu (memuat sheet Data Guru & Jadwal KBM) untuk sinkronisasi otomatis.
          </p>
        </div>

        <ClockBadges />
      </div>

      {/* ── PANDUAN RINGKAS ── */}
      <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 flex items-start gap-3.5 text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[13px] leading-relaxed text-blue-800 space-y-1">
          <p className="font-semibold text-blue-950">Petunjuk Format File Workbook Tunggal:</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800/90 text-xs">
            <li>File harus berupa <strong>satu workbook Excel</strong> (.xlsx / .xls) yang berisi 2 sheet.</li>
            <li><strong>Sheet Data Guru:</strong> Memuat identitas guru seperti Nama, Gelar, NIP, NUPTK, Jabatan, dan No. HP.</li>
            <li><strong>Sheet Jadwal KBM:</strong> Memuat matriks jadwal mingguan (Senin s.d. Jumat), daftar kelas, serta tabel Legenda Guru dan Mapel di bagian samping.</li>
          </ul>
        </div>
      </div>

      {/* ── UNIFIED UPLOAD AREA ── */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  Unggah Berkas Workbook Excel
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Pilih file .xlsx yang berisi sheet &ldquo;Data Guru&rdquo; dan sheet &ldquo;Jadwal KBM&rdquo;.
                </p>
              </div>

              {fileWorkbook && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Ganti File
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              className={`relative w-full h-[220px] rounded-[24px] border-2 border-dashed transition-all group flex flex-col items-center justify-center ${
                fileWorkbook
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30"
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {fileWorkbook ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-3">
                      <FileCheck className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <p className="text-[15px] font-bold text-slate-900 truncate max-w-[360px]">
                      {fileWorkbook.name}
                    </p>
                    <p className="text-[12px] text-slate-500 mt-1">
                      {(fileWorkbook.size / (1024 * 1024)).toFixed(2)} MB • Siap diproses
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-blue-100/50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
                      <UploadCloud className="w-7 h-7" strokeWidth={1.75} />
                    </div>
                    <p className="text-[15px] font-bold text-slate-900">
                      Tarik & Letakkan File Excel ke Sini
                    </p>
                    <p className="text-[13px] text-slate-500 mt-1">
                      atau <span className="text-blue-600 font-semibold underline underline-offset-2">pilih dari komputer</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Format: .xlsx, .xls • Maksimal 15 MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={processWorkbookFile}
              disabled={isParsing || !fileWorkbook}
              className="px-7 h-12 text-white text-sm font-bold rounded-xl flex items-center justify-center transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Menganalisis File...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Proses File Excel
                </>
              )}
            </button>
          </div>

          {/* Error Alert */}
          {importError && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium leading-relaxed">
                <p className="font-bold">Gagal Memproses:</p>
                <p>{importError}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {importSuccess && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3.5 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[15px] font-bold text-emerald-950">
                  Sinkronisasi Data Berhasil!
                </p>
                <p className="text-sm text-emerald-800/90">
                  Seluruh data guru aktif, kelas, dan jadwal KBM telah disinkronkan ke database sekolah.
                </p>
                {importStats && (
                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100">
                      Guru: +{importStats.gurusInserted} baru, {importStats.gurusUpdated} diperbarui
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100">
                      Kelas: +{importStats.kelasesInserted} baru
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100">
                      Jadwal: +{importStats.jadwalsInserted} baru, {importStats.jadwalsUpdated} diperbarui
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL OVERLAY (RINGKASAN ANALISIS DATA SEBELUM IMPORT) ── */}
      {parsedData && !importSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setParsedData(null)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-[580px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ringkasan Analisis Data</h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  Data siap disinkronisasi ke sistem. Periksa ringkasan sebelum mengeksekusi import.
                </p>
              </div>
              <button
                onClick={() => setParsedData(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Grid 4 Kartu Statistik */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">GURU AKTIF KBM</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {parsedData.ptk.length + kbmOnlyGurus.length + selectedExtraPtkNames.length}
                    <span className="text-xs font-normal text-slate-400 ml-1.5">
                      ({parsedData.ptk.length + kbmOnlyGurus.length} KBM
                      {selectedExtraPtkNames.length > 0 ? ` + ${selectedExtraPtkNames.length} Manual` : ""})
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {parsedData.ptk.length} dari Data Guru • {kbmOnlyGurus.length} dari KBM
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">MATA PELAJARAN</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Object.keys(parsedData.legendaMapel).length}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">Mapel terdeteksi dari KBM</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">RUANG KELAS</p>
                  <p className="text-2xl font-bold text-slate-900">{parsedData.kelases.length}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Kelas terdeteksi dari KBM</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">BLOK JADWAL KBM</p>
                  <p className="text-2xl font-bold text-slate-900">{parsedData.jadwals.length}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Jam berurutan telah disatukan</p>
                </div>
              </div>

              {/* Catatan Guru Luar Sheet Guru */}
              {kbmOnlyGurus.length > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Terdapat <strong>{kbmOnlyGurus.length} guru</strong> yang tercantum di Jadwal KBM tetapi belum ada di Sheet Data Guru. Sistem akan otomatis mendaftarkannya dengan NIP sementara.
                  </p>
                </div>
              )}

              {/* Accordion Guru Non-KBM yang dilewati */}
              {skippedPtkGurus.length > 0 && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSkippedAccordion(!showSkippedAccordion)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-100/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-[13px] font-bold text-amber-900">
                          {skippedPtkGurus.length} Guru di Data Guru Tidak Mengajar di KBM
                        </span>
                        <p className="text-[11px] text-amber-700/80 mt-0.5">
                          Klik untuk melihat rincian atau centang jika ingin tetap didaftarkan (Kepsek / BK)
                        </p>
                      </div>
                    </div>
                    {showSkippedAccordion ? (
                      <ChevronUp className="w-4 h-4 text-amber-700 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-700 shrink-0 ml-2" />
                    )}
                  </button>

                  {showSkippedAccordion && (
                    <div className="p-4 pt-1 border-t border-amber-200/60 space-y-2">
                      <p className="text-[11px] text-slate-500 mb-2">
                        Pilih guru yang ingin tetap dibuatkan akun sistem meskipun tidak memiliki jadwal mengajar di kelas:
                      </p>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {skippedPtkGurus.map((ptk) => {
                          const isSelected = selectedExtraPtkNames.includes(ptk.nama);
                          return (
                            <div
                              key={ptk.nama}
                              onClick={() => toggleExtraPtk(ptk.nama)}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50/90 border-blue-300 shadow-xs"
                                  : "bg-white/80 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-semibold text-slate-900 truncate">
                                    {ptk.nama}
                                  </p>
                                  {isSelected && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                      Tetap Ditambahkan
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  NIP: {ptk.nip || ptk.nuptk || "-"} • {ptk.jabatan || ptk.jenisPtk}
                                </p>
                              </div>

                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-5 h-11 border border-slate-200 text-slate-700 text-[14px] font-bold rounded-[14px] hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-7 h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 text-white text-[14px] font-bold rounded-[14px] flex items-center justify-center transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  "Eksekusi Import"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

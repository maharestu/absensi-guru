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
  Check
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { importExcelData, ParsedData } from "@/actions/import";
import { isNameMatch } from "@/lib/name-matcher";
import { normalizeTimeString } from "@/lib/format";

export default function ImportDataPage() {
  const [filePtk, setFilePtk] = useState<File | null>(null);
  const [fileKbm, setFileKbm] = useState<File | null>(null);

  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [skippedPtkGurus, setSkippedPtkGurus] = useState<ParsedData["ptk"]>([]);
  const [selectedExtraPtkNames, setSelectedExtraPtkNames] = useState<string[]>([]);
  const [kbmOnlyGurus, setKbmOnlyGurus] = useState<{ kode: string; nama: string }[]>([]);
  const [showSkippedAccordion, setShowSkippedAccordion] = useState(false);

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

  const toggleExtraPtk = (nama: string) => {
    setSelectedExtraPtkNames((prev) =>
      prev.includes(nama) ? prev.filter((n) => n !== nama) : [...prev, nama]
    );
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
      // 1. PROSES & VALIDASI FILE DATA PTK
      const bufferPtk = await filePtk.arrayBuffer();
      const wbPtk = XLSX.read(bufferPtk, { type: "array" });
      const sheetPtkName = wbPtk.SheetNames.find((s: string) => s.toLowerCase() === "ptk" || s.toLowerCase().includes("ptk")) || wbPtk.SheetNames[0];
      const dataPtkRaw = XLSX.utils.sheet_to_json(wbPtk.Sheets[sheetPtkName], { header: 1, defval: "", raw: false }) as any[][];

      // Cek apakah ini file KBM yang nyasar ke input PTK
      const ptkStr = dataPtkRaw.slice(0, 15).map(r => r.join(" ")).join(" ");
      if (ptkStr.includes("7A") || ptkStr.includes("8A") || ptkStr.includes("LEGENDA GURU")) {
        throw new Error("File yang Anda masukkan ke kolom 'Data PTK' terdeteksi sebagai file 'Jadwal KBM'. Harap periksa kembali file Anda.");
      }

      // Cari baris header PTK
      let headerRowIndex = -1;
      for (let i = 0; i < 20; i++) {
        if (!dataPtkRaw[i]) continue;
        const rowStrings = dataPtkRaw[i].map((c: any) => String(c).trim().toLowerCase());
        if (rowStrings.includes("nama") || rowStrings.includes("nip")) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("Format file 'Data PTK' tidak dikenali. Pastikan file memiliki kolom 'Nama' atau 'NIP'.");
      }

      const headers = dataPtkRaw[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
      const colNama = headers.findIndex((h: string) => h === "nama" || h === "nama lengkap" || h === "nama guru" || h.includes("nama"));
      
      if (colNama === -1) {
        throw new Error("Kolom 'Nama' tidak ditemukan di file 'Data PTK'. Harap gunakan format yang sesuai.");
      }

      const colNip = headers.findIndex((h: string) =>
        h === "nip" || h === "no. nip" || h === "no nip" || h === "nomor nip" || h === "nip/nuptk" || h === "nip / nuptk" || (h.includes("nip") && !h.includes("jenis"))
      );
      const colNuptk = headers.findIndex((h: string) =>
        h === "nuptk" || h === "no. nuptk" || h === "no nuptk" || h === "nomor nuptk" || h.includes("nuptk")
      );
      const colJenisPtk = headers.findIndex((h: string) => h === "jenis ptk" || h.includes("jenis ptk"));
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

      const rawPtkGurus: ParsedData["ptk"] = [];

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

          let rawNoTelepon = colNoTelepon !== -1 ? String(row[colNoTelepon] || "").trim() : "";
          if (rawNoTelepon === "-" || rawNoTelepon === "0") rawNoTelepon = "";

          let rawJabatan = colJabatan !== -1 ? String(row[colJabatan] || "").trim() : "";
          if (!rawJabatan || rawJabatan === "-") rawJabatan = "Guru";

          let rawNipVal = colNip !== -1 ? String(row[colNip] || "").trim() : "";
          if (rawNipVal === "-" || rawNipVal.toLowerCase() === "null") rawNipVal = "";

          let rawNuptkVal = colNuptk !== -1 ? String(row[colNuptk] || "").trim() : "";
          if (rawNuptkVal === "-" || rawNuptkVal.toLowerCase() === "null") rawNuptkVal = "";

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

      if (rawPtkGurus.length === 0) {
        throw new Error("Tidak ada data guru yang ditemukan dalam file 'Data PTK'.");
      }

      // 2. PROSES & VALIDASI FILE JADWAL KBM
      const bufferKbm = await fileKbm.arrayBuffer();
      const wbKbm = XLSX.read(bufferKbm, { type: "array" });
      const sheetKbmName = wbKbm.SheetNames.find((s: string) => s.toLowerCase() === "jadwal kbm" || s.toLowerCase().includes("kbm") || s.toLowerCase().includes("jadwal")) || wbKbm.SheetNames[0];
      const dataKbmRaw = XLSX.utils.sheet_to_json(wbKbm.Sheets[sheetKbmName], { header: 1, defval: "" }) as any[][];

      // Cek apakah ini file PTK yang nyasar ke input KBM
      const kbmStr = dataKbmRaw.slice(0, 15).map(r => r.join(" ")).join(" ");
      if (kbmStr.toLowerCase().includes("ptk") && (kbmStr.toLowerCase().includes("gelar") || kbmStr.toLowerCase().includes("nip"))) {
        throw new Error("File yang Anda masukkan ke kolom 'Data Jadwal KBM' terdeteksi sebagai file 'Profil PTK'. Harap periksa kembali file Anda.");
      }

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

      if (Object.keys(legendaGuru).length === 0) {
        throw new Error("Format file 'Jadwal KBM' tidak valid. Kolom 'Legenda Guru' tidak ditemukan (biasanya di kolom AA & AB).");
      }

      // Deteksi baris header kelas (misal baris yang memuat 7A, 8A, 9A)
      let headerKbmRowIndex = -1;
      for (let i = 0; i < Math.min(25, dataKbmRaw.length); i++) {
        if (!dataKbmRaw[i]) continue;
        const str = dataKbmRaw[i].map((c: any) => String(c).trim()).join(" ");
        if (str.includes("7A") || str.includes("8A") || str.includes("9A")) {
          headerKbmRowIndex = i;
          break;
        }
      }

      if (headerKbmRowIndex === -1) {
        throw new Error("Struktur kelas (7A, 8A, 9A, dsb) tidak ditemukan dalam file 'Jadwal KBM'.");
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
            const parts = jamRaw.split("-").map((s) => s.trim());
            if (parts[0]) jamMulaiStr = normalizeTimeString(parts[0]);
            if (parts[1]) jamSelesaiStr = normalizeTimeString(parts[1]);
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

      // 3. FILTERING: HANYA GURU YANG AKTIF DI JADWAL KBM
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

      // KBM Only Gurus (guru aktif di KBM yang belum ada di file PTK)
      const kbmOnlyList: { kode: string; nama: string }[] = [];
      for (const [kode, nama] of activeKbmEntries) {
        const isInPtk = rawPtkGurus.some((ptk) => isNameMatch(ptk.nama, nama));
        if (!isInPtk) {
          kbmOnlyList.push({ kode, nama });
        }
      }

      setSkippedPtkGurus(skippedPtkList);
      setSelectedExtraPtkNames([]);
      setKbmOnlyGurus(kbmOnlyList);
      setShowSkippedAccordion(false);

      setParsedData({
        ptk: matchedPtkList,
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
      // Gabungkan guru aktif KBM dari PTK dengan guru non-KBM yang dipilih admin (jika ada)
      const extraPtks = skippedPtkGurus.filter((p) => selectedExtraPtkNames.includes(p.nama));
      const finalPtkList = [...parsedData.ptk, ...extraPtks];

      const result = await importExcelData({
        ...parsedData,
        ptk: finalPtkList
      });

      if (result.success) {
        setImportSuccess(true);
        setParsedData(null);
        setSkippedPtkGurus([]);
        setSelectedExtraPtkNames([]);
        setKbmOnlyGurus([]);
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
            Unggah File PTK dan File Jadwal KBM untuk sinkronisasi guru aktif dan jadwal secara otomatis.
          </p>
        </div>

        <ClockBadges />
      </div>

      {/* ── UPLOAD AREA ── */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8">

          <div className="flex flex-col gap-8">
            {/* Upload PTK */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">1. Data Profil Guru / PTK (Excel / CSV)</h3>
              <p className="text-[13px] text-slate-500 mt-0.5 mb-3">Pilih file data guru profil PTK sekolah. Hanya guru aktif mengajar yang akan diproses secara default.</p>

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
              <p className="text-[13px] text-slate-500 mt-0.5 mb-3">Pilih file Jadwal KBM. Seluruh guru aktif, kelas, dan blok jadwal akan dipetakan otomatis.</p>

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
              className="px-6 h-12 text-white text-sm font-bold rounded-xl flex items-center justify-center transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Memproses File...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Proses File
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
              <p className="text-sm font-medium leading-relaxed">Data guru aktif dan jadwal KBM berhasil disinkronisasi ke database.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL OVERLAY (RINGKASAN ANALISIS DARI KEDUA FILE) ── */}
      {parsedData && !importSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setParsedData(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-[560px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ringkasan Analisis Data</h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  Data difilter otomatis: hanya guru yang aktif di jadwal KBM yang diproses.
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
                      ({parsedData.ptk.length + kbmOnlyGurus.length} KBM{selectedExtraPtkNames.length > 0 ? ` + ${selectedExtraPtkNames.length} Manual` : ""})
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {parsedData.ptk.length} dari PTK • {kbmOnlyGurus.length} dari KBM
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
                          {skippedPtkGurus.length} Guru di Profil PTK Tidak Mengajar di KBM
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
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${isSelected
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
                                  NIP: {ptk.nip || ptk.nuptk || "-"} • {ptk.jenisPtk}
                                </p>
                              </div>

                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${isSelected
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

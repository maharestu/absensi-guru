"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { importSmartJadwal, SmartJadwalPayload } from "@/actions/jadwal";
import { ClockBadges } from "./ui/ClockBadges";

export default function ImportDataClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<SmartJadwalPayload | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setMessage(null);
    setPayload(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        
        // Cari sheet yang mengandung kata "JADWAL"
        const sheetName = workbook.SheetNames.find(s => s.toUpperCase().includes("JADWAL")) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // header: 1 menghasilkan array of arrays (index based)
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const gurus: { kode: number; nama: string }[] = [];
        const mapels: { kode: string; nama: string }[] = [];
        const kelasNames: string[] = [];
        const jadwals: SmartJadwalPayload["jadwals"] = [];

        // 1. Cari Header Kelas (Baris yang ada "7A", "7B")
        let kelasRowIndex = -1;
        let colKelasMap: Record<number, string> = {}; // columnIndex -> kelasName
        
        for (let i = 0; i < 20; i++) {
          if (!rawRows[i]) continue;
          if (rawRows[i].includes("7A")) {
            kelasRowIndex = i;
            rawRows[i].forEach((cell, colIdx) => {
              if (typeof cell === "string" && (cell.startsWith("7") || cell.startsWith("8") || cell.startsWith("9"))) {
                colKelasMap[colIdx] = cell;
                if (!kelasNames.includes(cell)) kelasNames.push(cell);
              }
            });
            break;
          }
        }

        if (kelasRowIndex === -1) {
          throw new Error("Format tidak dikenali: Tidak menemukan baris header kelas (7A, 7B, dll).");
        }

        // 2. Scan seluruh baris untuk mengekstrak Guru, Mapel, dan Jadwal
        let currentHari = "senin";

        for (let i = kelasRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row) continue;

          // Ekstrak Hari
          if (typeof row[0] === "string" && row[0].trim() !== "") {
            const h = row[0].trim().toLowerCase();
            if (["senin", "selasa", "rabu", "kamis", "jum'at", "jumat"].includes(h)) {
              currentHari = h === "jum'at" ? "jumat" : h;
            }
          }

          // Ekstrak Guru (biasanya ada di index kolom mendekati akhir, misal index 26 & 27)
          // Cari angka yang diikuti nama guru
          for (let c = 20; c < 30; c++) {
            if (typeof row[c] === "number" && typeof row[c+1] === "string" && row[c+1].toLowerCase().includes("pd")) {
              if (!gurus.find(g => g.kode === row[c])) {
                gurus.push({ kode: row[c], nama: row[c+1].trim() });
              }
            }
          }

          // Ekstrak Mapel (KODE, MATA PELAJARAN) - biasanya berupa 1 huruf dan mapel
          for (let c = 20; c < 30; c++) {
            if (typeof row[c] === "string" && row[c].length === 1 && typeof row[c+1] === "string") {
              const huruf = row[c].trim().toUpperCase();
              const mapel = row[c+1].trim();
              if (huruf >= "A" && huruf <= "Z" && mapel.length > 3 && mapel !== "MATA PELAJARAN" && !mapel.includes("pd")) {
                if (!mapels.find(m => m.kode === huruf)) {
                  mapels.push({ kode: huruf, nama: mapel });
                }
              }
            }
          }

          // Ekstrak Jadwal Mengajar dari grid
          const jamKe = row[1];
          const waktu = row[2]; // ex: "07.30-08.10"
          
          if (typeof jamKe === "number" && typeof waktu === "string" && waktu.includes("-")) {
            const [jamMulai, jamSelesai] = waktu.split("-").map(s => s.trim());
            
            // Cek setiap kolom kelas
            Object.keys(colKelasMap).forEach(colIdxStr => {
              const colIdx = parseInt(colIdxStr);
              const cellValue = row[colIdx];
              
              if (typeof cellValue === "string") {
                const cleanCell = cellValue.trim();
                // Format ex: "14G", "22K"
                const match = cleanCell.match(/^(\d+)([A-Z])$/i);
                if (match) {
                  jadwals.push({
                    hari: currentHari,
                    kelasName: colKelasMap[colIdx],
                    jamMulai,
                    jamSelesai,
                    guruKode: parseInt(match[1]),
                    mapelKode: match[2].toUpperCase(),
                  });
                }
              }
            });
          }
        }

        setPayload({
          gurus,
          mapels,
          kelas: kelasNames.map(nama_kelas => ({ nama_kelas })),
          jadwals,
        });

      } catch (e: any) {
        console.error(e);
        setMessage({ type: "error", text: `Gagal membaca file: ${e.message}` });
      }
    };
    reader.readAsBinaryString(selected);
  };

  const handleImport = async () => {
    if (!payload) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await importSmartJadwal(payload);
      if (res.success) {
        setMessage({
          type: "success",
          text: `Ajaib! Berhasil membuat data Guru, Kelas, dan menyisipkan ${res.count} jadwal secara otomatis!`,
        });
        setFile(null);
        setPayload(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setMessage({
          type: "error",
          text: `Gagal mengeksekusi import: ${res.error}`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            ✨ Smart Import KBM
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium max-w-2xl">
            Satu klik untuk mengimpor <strong>Guru, Kelas, dan Jadwal Mengajar</strong> sekaligus dari file Excel `JADWAL KBM` sekolah Anda.
          </p>
        </div>
        <ClockBadges />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column - Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Unggah File Jadwal</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Upload file Excel yang berisi sheet <strong>JADWAL KBM</strong>. Sistem pintar kami akan otomatis menerjemahkan kode guru (contoh: 14G).
            </p>
            
            <input
              ref={fileRef}
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-3 file:px-5
                file:rounded-xl file:border-0
                file:text-sm file:font-bold
                file:bg-slate-900 file:text-white
                hover:file:bg-slate-800 transition-colors cursor-pointer
                border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mb-2 p-2
              "
            />
            {file && (
              <p className="text-xs text-blue-600 font-bold mt-3 bg-blue-50 py-2 px-3 rounded-lg inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                {file.name}
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">🪄</span> Magic Happens Here
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Tidak perlu membuat data guru dan kelas secara manual. Fitur ini akan membaca KODE GURU dan MATA PELAJARAN lalu <strong>otomatis mendaftarkan</strong> guru & kelas baru ke database Anda!
              </p>
              
              {message && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.type === "success" ? "bg-green-500/20 text-green-100 border border-green-500/30" : "bg-red-500/20 text-red-100 border border-red-500/30"}`}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!payload || loading}
                className="w-full px-6 py-4 bg-white text-slate-900 rounded-2xl text-[15px] font-bold shadow-lg hover:bg-blue-50 hover:text-blue-700 transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-900 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menyusun Database...
                  </>
                ) : (
                  "Eksekusi & Simpan ke Database"
                )}
              </button>
            </div>
            
            {/* Dekorasi BG */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          </div>
        </div>

        {/* Right Column - Preview Data */}
        <div className="lg:col-span-3">
          {payload ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Analisis Berhasil!</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Berikut adalah rekapitulasi data yang berhasil dibaca oleh AI.
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Guru Baru</p>
                  <p className="text-3xl font-black text-slate-800">{payload.gurus.length}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ruang Kelas</p>
                  <p className="text-3xl font-black text-slate-800">{payload.kelas.length}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Slot Jadwal</p>
                  <p className="text-3xl font-black text-blue-700">{payload.jadwals.length}</p>
                </div>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-[400px]">
                <p className="text-sm font-bold text-slate-900">Sampel Jadwal Terjemahan:</p>
                {payload.jadwals.slice(0, 5).map((j, idx) => {
                  const guru = payload.gurus.find(g => g.kode === j.guruKode)?.nama || "Unknown";
                  const mapel = payload.mapels.find(m => m.kode === j.mapelKode)?.nama || "Unknown";
                  return (
                    <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center shadow-sm">
                      <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap self-start sm:self-auto">
                        {j.hari.toUpperCase()} • {j.jamMulai}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{guru}</p>
                        <p className="text-xs text-slate-500 font-medium">{mapel} — Kelas {j.kelasName}</p>
                      </div>
                    </div>
                  );
                })}
                {payload.jadwals.length > 5 && (
                  <div className="text-center py-4 text-xs font-bold text-slate-400">
                    + {payload.jadwals.length - 5} jadwal lainnya siap diimport
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-7 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700">Belum Ada File</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">
                Silakan upload file JADWAL KBM di panel kiri untuk melihat pratinjau hasil ekstraksi kecerdasan buatan.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";

// --- MOCK DATA FOR LAPORAN MENGAJAR ---
const MOCK_LAPORAN_MENGAJAR = [
  { id: 1, tanggal: "17 Sep 2026", nama: "Ahmad Fauzan, S.Pd.", kelasMapel: "VII A / Matematika", waktu: "06:30 - 8:00", status: "Mengajar" },
  { id: 2, tanggal: "17 Sep 2026", nama: "Siti Rahmawati, S.Pd.", kelasMapel: "VIII B / IPA", waktu: "06:30 - 8:00", status: "Mengajar" },
  { id: 3, tanggal: "17 Sep 2026", nama: "Dimas Pratama, S.Pd.", kelasMapel: "VII B / Seni Budaya", waktu: "8:30 - 10:00", status: "—" },
  { id: 4, tanggal: "16 Sep 2026", nama: "Nadia Kusuma, S.Pd.", kelasMapel: "IX A / Kimia", waktu: "06:30 - 8:00", status: "Mengajar" },
  { id: 5, tanggal: "16 Sep 2026", nama: "Rudi Hartono, S.Pd.", kelasMapel: "IX B / Olahraga", waktu: "10:00 - 12:30", status: "—" },
  { id: 6, tanggal: "16 Sep 2026", nama: "Lina Marlina, S.Pd.", kelasMapel: "VIII C / IPS", waktu: "10:00 - 12:30", status: "Mengajar" },
];

// --- MOCK DATA FOR LAPORAN KEHADIRAN ---
const MOCK_LAPORAN_KEHADIRAN = [
  { id: 1, tanggal: "17 Sep 2026", nama: "Ahmad Fauzan, S.Pd.", waktu_masuk: "06:52", status: "Hadir" },
  { id: 2, tanggal: "17 Sep 2026", nama: "Siti Rahmawati, S.Pd.", waktu_masuk: "06:58", status: "Hadir" },
  { id: 3, tanggal: "17 Sep 2026", nama: "Dimas Pratama, S.Pd.", waktu_masuk: "—", status: "Izin" },
  { id: 4, tanggal: "16 Sep 2026", nama: "Nadia Kusuma, S.Pd.", waktu_masuk: "07:06", status: "Hadir" },
  { id: 5, tanggal: "16 Sep 2026", nama: "Rudi Hartono, S.Pd.", waktu_masuk: "—", status: "Sakit" },
];

export default function LaporanAbsensiPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [activeTab, setActiveTab] = useState<"kehadiran" | "mengajar">("kehadiran");
  const [isFiltered, setIsFiltered] = useState(true);

  const handleTampilkan = () => {
    setIsFiltered(true);
  };

  const handleTabChange = (tab: "kehadiran" | "mengajar") => {
    setActiveTab(tab);
  };

  const handleExport = () => {
    alert("Mengekspor data ke Excel (.xlsx)...");
  };

  const pageTitle =
    activeTab === "kehadiran"
      ? "Laporan Absensi Kehadiran"
      : "Laporan Absensi Mengajar";

  return (
    <div className="space-y-6">
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-normal">
            Rekap periode 1–17 September 2026
          </p>
        </div>

        {/* Top Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Clock className="w-[18px] h-[18px] text-slate-800" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-800">{timeString}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Calendar className="w-[18px] h-[18px] text-slate-800" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-800">{dateString}</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="inline-flex bg-white rounded-xl border border-slate-200/70 p-1">
        <button
          onClick={() => handleTabChange("kehadiran")}
          className={`px-8 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "kehadiran"
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Kehadiran
        </button>
        <button
          onClick={() => handleTabChange("mengajar")}
          className={`px-8 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "mengajar"
            ? "bg-blue-50 text-blue-600"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          Mengajar
        </button>
      </div>

      {/* ── FILTER SECTION ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end gap-4">

          <div className="flex-1 space-y-2">
            <label className="text-[11px] font-bold text-slate-900 tracking-wider">Periode</label>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>01 Sep 2026 - 17 Sep 2026</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {activeTab === "kehadiran" ? (
            // Filter untuk Kehadiran
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-slate-900 tracking-wider">Status</label>
              <div className="relative">
                <select className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option>Semua Status</option>
                  <option>Hadir</option>
                  <option>Sakit</option>
                  <option>Izin</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            // Filter untuk Mengajar (Kelas & Mata Pelajaran)
            <>
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 tracking-wider">Kelas</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option>Semua Kelas</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 tracking-wider">Mata Pelajaran</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option>Semua Mata Pelajaran</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex-1 space-y-2">
            <label className="text-[11px] font-bold text-slate-900 tracking-wider">Guru</label>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>Semua Guru</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex-shrink-0">
            <button
              type="button"
              onClick={handleTampilkan}
              className="w-full md:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              style={{ width: 134, height: 44 }}
            >
              Tampilkan
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {!isFiltered ? (
        // Empty State
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[450px]">
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Pilih filter laporan
          </h2>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            Atur periode, {activeTab === "kehadiran" ? "status," : "kelas, mata pelajaran,"} atau guru lalu klik "Tampilkan"
            untuk melihat laporan absensi {activeTab === "kehadiran" ? "kehadiran" : "mengajar"}.
          </p>
        </div>
      ) : activeTab === "mengajar" ? (
        // Result State (Mengajar)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-1/2">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Jadwal</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">135</h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Mengajar</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">130</h2>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rincian Laporan</h2>
              <button
                type="button"
                onClick={handleExport}
                className="w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                style={{ width: 134, height: 44 }}
              >
                Ekspor
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="pb-4 font-semibold w-[15%]">TANGGAL</th>
                    <th className="pb-4 font-semibold w-[25%]">NAMA GURU</th>
                    <th className="pb-4 font-semibold w-[30%]">Kelas / Mata Pelajaran</th>
                    <th className="pb-4 font-semibold w-[15%]">WAKTU</th>
                    <th className="pb-4 font-semibold w-[15%]">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {MOCK_LAPORAN_MENGAJAR.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 font-semibold text-slate-800">{row.tanggal}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.nama}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.kelasMapel}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.waktu}</td>
                      <td className="py-4 font-medium text-slate-600">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        // Result State (Kehadiran)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards Kehadiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {/* Card 1: Guru Hadir */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Guru Hadir</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">135</h2>
              </div>
            </div>

            {/* Card 2: Izin */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="18" x="5" y="3" rx="3" />
                  <path d="M9 9h6" />
                  <path d="M9 13h6" />
                  <path d="M9 17h4" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Izin</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">15</h2>
              </div>
            </div>

            {/* Card 3: Sakit */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-rose-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="3" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                  <path d="M10 16h4" />
                  <path d="M12 14v4" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Sakit</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">5</h2>
              </div>
            </div>

            {/* Card 4: Tidak Hadir */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="14" x="3" y="5" rx="3" />
                  <path d="M3 10h18" />
                  <path d="m15 15 4 4" />
                  <path d="m19 15-4 4" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Tidak Hadir</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">9</h2>
              </div>
            </div>
          </div>

          {/* Table Section Kehadiran */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rincian Laporan</h2>
              <button
                type="button"
                onClick={handleExport}
                className="w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                style={{ width: 134, height: 44 }}
              >
                Ekspor
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="pb-4 font-semibold w-[20%]">TANGGAL</th>
                    <th className="pb-4 font-semibold w-[40%]">NAMA GURU</th>
                    <th className="pb-4 font-semibold w-[20%]">STATUS</th>
                    <th className="pb-4 font-semibold w-[20%]">WAKTU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {MOCK_LAPORAN_KEHADIRAN.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 font-semibold text-slate-800">{row.tanggal}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.nama}</td>
                      <td className="py-4 font-medium text-slate-600">{row.status}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.waktu_masuk}</td>
                    </tr>
                  ))}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 font-semibold text-slate-800">16 Sep 2026</td>
                    <td className="py-4 text-slate-500 font-medium">Lina Marlina, S.Pd.</td>
                    <td className="py-4 font-medium text-slate-600">Hadir</td>
                    <td className="py-4 text-slate-500 font-medium">06:55</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

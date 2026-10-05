"use client";

import React, { useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { getLaporanKehadiran, getLaporanMengajar, LaporanKehadiran, LaporanMengajar } from "@/actions/laporan";
import { getGuruList } from "@/actions/guru";
import { getKelasList } from "@/actions/kelas";
import { Guru, Kelas } from "@/types/schema";
import { useEffect, useRef } from "react";

function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: {value: string, label: string}[], 
  value: string, 
  onChange: (v: string) => void,
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input 
              type="text" 
              autoFocus
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">Tidak ditemukan</div>
            ) : (
              filtered.map(opt => (
                <div 
                  key={opt.value}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${value === opt.value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
}

export default function LaporanAbsensiPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [activeTab, setActiveTab] = useState<"kehadiran" | "mengajar">("kehadiran");
  const [isFiltered, setIsFiltered] = useState(true);
  const [laporanKehadiran, setLaporanKehadiran] = useState<LaporanKehadiran[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [laporanMengajar, setLaporanMengajar] = useState<LaporanMengajar[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailModalGuruId, setDetailModalGuruId] = useState<string | null>(null);

  const [selectedGuru, setSelectedGuru] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");

  const [appliedGuru, setAppliedGuru] = useState<string>("all");
  const [appliedStatus, setAppliedStatus] = useState<string>("all");
  const [appliedKelas, setAppliedKelas] = useState<string>("all");

  // Filter Data Kehadiran
  const filteredKehadiran = laporanKehadiran.filter(r => {
    const matchGuru = appliedGuru === "all" || r.guru_id === appliedGuru;
    const matchStatus = appliedStatus === "all" || r.status.toLowerCase() === appliedStatus.toLowerCase();
    return matchGuru && matchStatus;
  });

  // Filter Data Mengajar
  const filteredMengajar = laporanMengajar.filter(r => {
    const matchGuru = appliedGuru === "all" || r.guru_id === appliedGuru;
    const matchKelas = appliedKelas === "all" || r.kelas_id === appliedKelas;
    return matchGuru && matchKelas;
  });

  // Hitung jumlah statistik Kehadiran secara dinamis
  const countHadir = filteredKehadiran.filter((r) => r.status.toLowerCase() === "hadir").length;
  const countIzin = filteredKehadiran.filter((r) => r.status.toLowerCase() === "izin").length;
  const countSakit = filteredKehadiran.filter((r) => r.status.toLowerCase() === "sakit").length;
  const countTidakHadir = 0;

  // Hitung jumlah statistik Mengajar secara dinamis
  const countMengajar = filteredMengajar.length;
  const countJadwal = filteredMengajar.length;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [kehadiran, mengajar, gurus, kelasArr] = await Promise.all([
          getLaporanKehadiran(),
          getLaporanMengajar(),
          getGuruList(),
          getKelasList()
        ]);
        setLaporanKehadiran(kehadiran);
        setLaporanMengajar(mengajar);
        setGuruList(gurus);
        setKelasList(kelasArr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTampilkan = () => {
    setIsFiltered(true);
    setAppliedGuru(selectedGuru);
    setAppliedStatus(selectedStatus);
    setAppliedKelas(selectedKelas);
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

          <div className="flex-1 space-y-2">
            <label className="text-[11px] font-bold text-slate-900 tracking-wider">Guru</label>
            <SearchableSelect 
              placeholder="Semua Guru"
              value={selectedGuru}
              onChange={setSelectedGuru}
              options={[
                { value: "all", label: "Semua Guru" },
                ...guruList.map(g => ({ value: g.id, label: g.nama }))
              ]}
            />
          </div>

          {activeTab === "kehadiran" ? (
            // Filter untuk Kehadiran
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-slate-900 tracking-wider">Status</label>
              <div className="relative">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="hadir">Hadir</option>
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
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
                <SearchableSelect 
                  placeholder="Semua Kelas"
                  value={selectedKelas}
                  onChange={setSelectedKelas}
                  options={[
                    { value: "all", label: "Semua Kelas" },
                    ...kelasList.map(k => ({ value: k.id, label: k.nama_kelas }))
                  ]}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold text-slate-900 tracking-wider">Status</label>
                <div className="relative">
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="mengajar">Mengajar</option>
                    <option value="tidak_mengajar">Tidak Mengajar</option>
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
            Atur periode, status, atau guru lalu klik "Tampilkan"<br />
            untuk melihat laporan absensi kehadiran.
          </p>
        </div>
      ) : activeTab === "mengajar" ? (
        // Result State (Mengajar)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 w-full sm:w-[260px]">
              <div className="w-13 h-13 rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Jadwal</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countJadwal}</h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 w-full sm:w-[260px]">
              <div className="w-13 h-13 rounded-2xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Mengajar</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countMengajar}</h2>
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
                    <th className="pb-4 font-semibold w-[10%]">STATUS</th>
                    <th className="pb-4 font-semibold w-[10%] text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMengajar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Tidak ada data yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMengajar.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 font-semibold text-slate-800">{row.tanggal}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.nama}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.kelasMapel}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.waktu}</td>
                      <td className="py-4 font-medium text-slate-600">{row.status}</td>
                      <td className="py-4 text-center">
                        <button 
                          onClick={() => setDetailModalGuruId(row.guru_id)}
                          className="border border-slate-300 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  )))}
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
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countHadir}</h2>
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
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countIzin}</h2>
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
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countSakit}</h2>
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
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countTidakHadir}</h2>
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
                    <th className="pb-4 font-semibold w-[35%]">NAMA GURU</th>
                    <th className="pb-4 font-semibold w-[15%]">STATUS</th>
                    <th className="pb-4 font-semibold w-[15%]">WAKTU</th>
                    <th className="pb-4 font-semibold w-[15%] text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredKehadiran.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Tidak ada data yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKehadiran.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 font-semibold text-slate-800">{row.tanggal}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.nama}</td>
                      <td className="py-4 font-medium text-slate-600">{row.status}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.waktu_masuk}</td>
                      <td className="py-4 text-center">
                        <button 
                          onClick={() => setDetailModalGuruId(row.guru_id)}
                          className="border border-slate-300 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModalGuruId && (() => {
        const detailGuru = guruList.find(g => g.id === detailModalGuruId);
        const detailKehadiran = laporanKehadiran.filter(r => r.guru_id === detailModalGuruId);
        const detailHadir = detailKehadiran.filter(r => r.status.toLowerCase() === "hadir").length;
        const detailSakit = detailKehadiran.filter(r => r.status.toLowerCase() === "sakit").length;
        const detailIzin = detailKehadiran.filter(r => r.status.toLowerCase() === "izin").length;
        const detailTidakHadir = 0;
        const detailDinasLuar = 0;
        const totalCatatan = detailKehadiran.length;
        const persentaseHadir = totalCatatan > 0 ? Math.round((detailHadir / totalCatatan) * 100) : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{detailGuru?.nama || "-"}</h2>
                  <p className="text-sm text-slate-500 mt-1">NIP {detailGuru?.nip || "-"}</p>
                </div>
                <button 
                  onClick={() => setDetailModalGuruId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 pt-0 space-y-6">
                
                {/* Stats Section */}
                <div className="border border-slate-200 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[15px] font-bold text-slate-900">Kehadiran selama periode</h3>
                    <span className="text-sm text-slate-500">01–17 Sep 2026</span>
                  </div>
                  
                  <div className="flex items-center gap-6 md:gap-10">
                    {/* Circle Progress */}
                    <div className="relative w-24 h-24 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-600"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeDasharray={`${persentaseHadir}, 100`}
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">{persentaseHadir}%</span>
                        <span className="text-[10px] font-medium text-slate-500">Hadir</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex-1 flex gap-2 md:gap-4 overflow-x-auto pb-2">
                      <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">Hadir</p>
                        <p className="text-xl font-bold text-blue-600">{detailHadir}</p>
                        <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                      </div>
                      <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">Sakit</p>
                        <p className="text-xl font-bold text-slate-800">{detailSakit}</p>
                        <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                      </div>
                      <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">Izin</p>
                        <p className="text-xl font-bold text-slate-800">{detailIzin}</p>
                        <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                      </div>
                      <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">Dinas luar</p>
                        <p className="text-xl font-bold text-slate-800">{detailDinasLuar}</p>
                        <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                      </div>
                      <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">Tidak hadir</p>
                        <p className="text-xl font-bold text-slate-800">{detailTidakHadir}</p>
                        <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Detail */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-100">
                    <h3 className="text-[15px] font-bold text-slate-900">Detail catatan kehadiran</h3>
                    <span className="text-sm text-slate-500">{totalCatatan} catatan</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50">
                        <tr className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                          <th className="py-3 px-5 w-[30%]">TANGGAL</th>
                          <th className="py-3 px-5 w-[40%]">STATUS</th>
                          <th className="py-3 px-5 w-[30%]">WAKTU MASUK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailKehadiran.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-500">Belum ada catatan</td>
                          </tr>
                        ) : (
                          detailKehadiran.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-5 font-semibold text-slate-800">{r.tanggal}</td>
                              <td className="py-3 px-5">
                                <span className={`font-semibold ${r.status.toLowerCase() === 'hadir' ? 'text-blue-600' : 'text-slate-600'}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-3 px-5 text-slate-500 font-medium">{r.waktu_masuk}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

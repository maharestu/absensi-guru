"use client";

import React, { useState } from "react";
import { Clock, Calendar, Camera, Search } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { getLaporanKehadiran, getLaporanMengajar, LaporanKehadiran, LaporanMengajar } from "@/actions/laporan";
import { getGuruList } from "@/actions/guru";
import { getKelasList } from "@/actions/kelas";
import { Guru, Kelas } from "@/types/schema";
import { useEffect, useRef } from "react";
import Pagination from "@/components/ui/pagination";
import { getStatusColorText } from "@/lib/status";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { LaporanDetailModal } from "@/components/kepsek/LaporanDetailModal";
import { PhotoOverlay } from "@/components/kepsek/PhotoOverlay";

export default function LaporanAbsensiPage() {

  const { timeString, dateString } = useRealtimeClock();
  const [activeTab, setActiveTab] = useState<"kehadiran" | "mengajar">("kehadiran");
  const [laporanKehadiran, setLaporanKehadiran] = useState<LaporanKehadiran[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [laporanMengajar, setLaporanMengajar] = useState<LaporanMengajar[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailModalGuruId, setDetailModalGuruId] = useState<string | null>(null);
  const [photoOverlayUrl, setPhotoOverlayUrl] = useState<string | null>(null);

  const [selectedGuru, setSelectedGuru] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");

  const [periodeType, setPeriodeType] = useState<string>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sync date based on periodType
  useEffect(() => {
    const today = new Date();
    if (periodeType === "today") {
      const d = today.toLocaleDateString('en-CA');
      setStartDate(d);
      setEndDate(d);
    } else if (periodeType === "last_7_days") {
      const dEnd = today.toLocaleDateString('en-CA');
      const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dStart = start.toLocaleDateString('en-CA');
      setStartDate(dStart);
      setEndDate(dEnd);
    } else if (periodeType === "this_month") {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    }
  }, [periodeType]);

  const [searchQuery, setSearchQuery] = useState("");

  // Filter Data Kehadiran
  const filteredKehadiran = laporanKehadiran.filter(r => {
    const matchGuru = selectedGuru === "all" || r.guru_id === selectedGuru;
    const matchStatus = selectedStatus === "all" || r.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchSearch = searchQuery === "" || 
      r.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGuru && matchStatus && matchSearch;
  });

  // Filter Data Mengajar
  const filteredMengajar = laporanMengajar.filter(r => {
    const matchGuru = selectedGuru === "all" || r.guru_id === selectedGuru;
    const matchKelas = selectedKelas === "all" || r.kelas_id === selectedKelas;
    const matchSearch = searchQuery === "" || 
      r.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mata_pelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGuru && matchKelas && matchSearch;
  });

  const [currentPageKehadiran, setCurrentPageKehadiran] = useState(1);
  const [currentPageMengajar, setCurrentPageMengajar] = useState(1);
  const itemsPerPage = 11;

  const paginatedKehadiran = filteredKehadiran.slice(
    (currentPageKehadiran - 1) * itemsPerPage,
    currentPageKehadiran * itemsPerPage
  );

  const paginatedMengajar = filteredMengajar.slice(
    (currentPageMengajar - 1) * itemsPerPage,
    currentPageMengajar * itemsPerPage
  );

  // Reset pagination if search changes
  useEffect(() => {
    setCurrentPageKehadiran(1);
    setCurrentPageMengajar(1);
  }, [searchQuery]);

  // Hitung jumlah statistik Kehadiran secara dinamis
  const countHadir = filteredKehadiran.filter((r) => r.status.toLowerCase() === "hadir").length;
  const countIzin = filteredKehadiran.filter((r) => r.status.toLowerCase() === "izin").length;
  const countSakit = filteredKehadiran.filter((r) => r.status.toLowerCase() === "sakit").length;
  const countDinas = filteredKehadiran.filter((r) => r.status.toLowerCase() === "dinas").length;
  const countTidakHadir = 0;

  // Hitung jumlah statistik Mengajar secara dinamis
  const countMengajar = filteredMengajar.length;
  const countJadwal = filteredMengajar.length;

  useEffect(() => {
    async function loadData() {
      if (!startDate || !endDate) return;
      setLoading(true);
      try {
        const [kehadiran, mengajar, gurus, kelasArr] = await Promise.all([
          getLaporanKehadiran(startDate, endDate),
          getLaporanMengajar(startDate, endDate),
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
  }, [startDate, endDate]);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatted = d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
      return formatted.replace(/ /g, "-");
    } catch {
      return dateStr;
    }
  };

  const handleTampilkan = async () => {
    // Tombol dipertahankan untuk manual refresh
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const [kehadiran, mengajar] = await Promise.all([
        getLaporanKehadiran(startDate, endDate),
        getLaporanMengajar(startDate, endDate),
      ]);
      setLaporanKehadiran(kehadiran);
      setLaporanMengajar(mengajar);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "kehadiran" | "mengajar") => {
    setActiveTab(tab);
    setSearchQuery(""); // Reset search when switching tabs
  };

  const handleExport = () => {
    const isKehadiran = activeTab === "kehadiran";
    const dataToExport = isKehadiran ? filteredKehadiran : filteredMengajar;

    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    let exportData;
    if (isKehadiran) {
      exportData = (dataToExport as LaporanKehadiran[]).map((row) => ({
        "Tanggal": row.tanggal,
        "Nama Guru": row.nama,
        "Status": row.status,
        "Waktu Masuk": row.waktu_masuk,
      }));
    } else {
      exportData = (dataToExport as LaporanMengajar[]).map((row) => ({
        "Tanggal": row.tanggal,
        "Nama Guru": row.nama,
        "Kelas": row.kelas,
        "Mata Pelajaran": row.mata_pelajaran,
        "Waktu": row.waktu,
        "Status": row.status,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // -- STYLING EXCEL --
    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:A1");
    
    // Header styling (Baris 0)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        fill: { 
          patternType: "solid",
          fgColor: { rgb: "FDE047" } // Warna kuning (Tailwind yellow-300)
        }, 
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        }
      };
    }

    // Body styling (Baris 1 ke bawah)
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
          }
        };
      }
    }

    // Set Column Widths (Wch = Width in Characters)
    worksheet['!cols'] = isKehadiran 
      ? [{ wch: 18 }, { wch: 35 }, { wch: 15 }, { wch: 15 }] 
      : [{ wch: 18 }, { wch: 35 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    
    const fileName = `Laporan_${isKehadiran ? "Kehadiran" : "Mengajar"}_${startDate}_sampai_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
            Rekap periode {formatDateLabel(startDate)} hingga {formatDateLabel(endDate)}
          </p>
        </div>

        {/* Top Badges */}
        <div className="hidden sm:flex items-center gap-3">
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
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-end gap-3 sm:gap-4">

          <div className="col-span-1 md:col-span-1 flex-1 space-y-2">
            <label className="text-[11px] font-bold text-slate-900 tracking-wider">Periode</label>
            <div className="relative">
              <select 
                value={periodeType}
                onChange={(e) => setPeriodeType(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="this_month">Bulan Ini</option>
                <option value="today">Hari Ini</option>
                <option value="last_7_days">7 Hari Terakhir</option>
                <option value="custom">Kustom</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            {periodeType === "custom" && (
              <div className="flex flex-col xl:flex-row xl:items-center gap-2 mt-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="hidden xl:inline text-slate-400">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-1 flex-1 space-y-2">
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
            <div className="col-span-2 md:col-span-1 flex-1 space-y-2">
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
                  <option value="dinas">Dinas Luar</option>
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
              <div className="col-span-1 flex-1 space-y-2">
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
              <div className="col-span-1 flex-1 space-y-2">
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

          <div className="col-span-2 mt-2 md:mt-0 flex-shrink-0">
            <button
              type="button"
              onClick={handleTampilkan}
              className="w-full md:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              Tampilkan
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {activeTab === "mengajar" ? (
        // Result State (Mengajar)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Jadwal</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countJadwal}</h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Mengajar</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countMengajar}</h2>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rincian Laporan</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari guru, kelas, mapel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full sm:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                >
                  Ekspor
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="pb-4 font-semibold w-[12%]">TANGGAL</th>
                    <th className="pb-4 font-semibold w-[22%]">NAMA GURU</th>
                    <th className="pb-4 font-semibold w-[12%]">KELAS</th>
                    <th className="pb-4 font-semibold w-[18%]">MATA PELAJARAN</th>
                    <th className="pb-4 font-semibold w-[16%]">WAKTU</th>
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
                    paginatedMengajar.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 font-semibold text-slate-800">{row.tanggal}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.nama}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.kelas}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.mata_pelajaran}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.waktu}</td>
                      <td className={`py-4 font-semibold ${getStatusColorText(row.status)}`}>{row.status}</td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {row.foto_absensi && (
                            <button
                              onClick={() => setPhotoOverlayUrl(row.foto_absensi!)}
                              className="border border-blue-200 bg-blue-50 text-blue-600 rounded-lg px-2 py-1.5 text-[13px] font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                              title="Lihat Foto"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => setDetailModalGuruId(row.guru_id)}
                            className="border border-slate-300 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            {filteredMengajar.length > 0 && (
              <Pagination
                currentPage={currentPageMengajar}
                totalItems={filteredMengajar.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPageMengajar}
              />
            )}
            </div>
          </div>

        </div>
      ) : (
        // Result State (Kehadiran)
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards Kehadiran */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {/* Card 1: Guru Hadir */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="4" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Guru Hadir</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countHadir}</h2>
              </div>
            </div>

            {/* Card 2: Izin */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="18" x="5" y="3" rx="3" />
                  <path d="M9 9h6" />
                  <path d="M9 13h6" />
                  <path d="M9 17h4" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Izin</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countIzin}</h2>
              </div>
            </div>

            {/* Card 3: Sakit */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-rose-500/20">
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
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Sakit</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countSakit}</h2>
              </div>
            </div>

            {/* Card: Dinas Luar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-teal-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-teal-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Dinas Luar</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countDinas}</h2>
              </div>
            </div>

            {/* Card 4: Tidak Hadir */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 col-span-2 lg:col-span-1">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="14" x="3" y="5" rx="3" />
                  <path d="M3 10h18" />
                  <path d="m15 15 4 4" />
                  <path d="m19 15-4 4" />
                </svg>
              </div>
              <div>
                <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Tidak Hadir</p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{countTidakHadir}</h2>
              </div>
            </div>
          </div>

          {/* Table Section Kehadiran */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rincian Laporan</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari guru atau status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full sm:w-[134px] h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                >
                  Ekspor
                </button>
              </div>
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
                    paginatedKehadiran.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 font-semibold text-slate-800">{row.tanggal}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.nama}</td>
                      <td className={`py-4 font-semibold ${getStatusColorText(row.status)}`}>{row.status}</td>
                      <td className="py-4 text-slate-500 font-medium">{row.waktu_masuk}</td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(row.foto_absensi || row.file_bukti_izin_sakit) && (
                            <button
                              onClick={() => setPhotoOverlayUrl((row.foto_absensi || row.file_bukti_izin_sakit)!)}
                              className="border border-blue-200 bg-blue-50 text-blue-600 rounded-lg px-2 py-1.5 text-[13px] font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                              title="Lihat Foto / Bukti"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => setDetailModalGuruId(row.guru_id)}
                            className="border border-slate-300 rounded-lg px-4 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
              {filteredKehadiran.length > 0 && (
                <Pagination
                  currentPage={currentPageKehadiran}
                  totalItems={filteredKehadiran.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPageKehadiran}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModalGuruId && (
        <LaporanDetailModal
          detailModalGuruId={detailModalGuruId}
          guruList={guruList}
          laporanKehadiran={laporanKehadiran}
          startDate={startDate}
          endDate={endDate}
          onClose={() => setDetailModalGuruId(null)}
          formatDateLabel={formatDateLabel}
        />
      )}

      {/* ── PHOTO OVERLAY ── */}
      <PhotoOverlay 
        photoUrl={photoOverlayUrl} 
        onClose={() => setPhotoOverlayUrl(null)} 
      />

    </div>
  );
}

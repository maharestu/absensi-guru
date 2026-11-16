"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Search, RefreshCw, Layers, CheckCircle2, AlertCircle, Clock, Eye, Info, AlertTriangle, Calendar } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import { ScrollingStatCards, StatCardItem } from "@/components/ui/ScrollingStatCards";
import {
  getMonitoringKelasRealtime,
  MonitoringKelasResponse,
  MonitoringKelasItem,
} from "@/actions/monitoring";
import { MonitoringDetailModal } from "@/components/kepsek/MonitoringDetailModal";

export default function MonitoringKelasPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [data, setData] = useState<MonitoringKelasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "sedang_digunakan" | "kosong">("semua");
  const [tingkatFilter, setTingkatFilter] = useState<string>("semua");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal Detail state
  const [selectedKelas, setSelectedKelas] = useState<MonitoringKelasItem | null>(null);

  // Fetch data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await getMonitoringKelasRealtime();
      setData(res);

      // Sinkronkan selectedKelas jika modal sedang terbuka
      setSelectedKelas((prev) => {
        if (!prev) return null;
        return res.kelasList.find((k) => k.kelasId === prev.kelasId) || prev;
      });
    } catch (err: any) {
      console.error("Gagal memuat data monitoring kelas:", err);
      setErrorMsg(err?.message || "Terjadi kesalahan saat memuat data monitoring kelas.");
    } finally {
      setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (polling setiap 30 detik)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, tingkatFilter]);

  // Filter logic
  const filteredKelas = (data?.kelasList || []).filter((item) => {
    // 1. Filter Status
    if (statusFilter !== "semua" && item.statusRuang !== statusFilter) {
      return false;
    }

    // 2. Filter Tingkat
    if (tingkatFilter !== "semua" && item.tingkat !== tingkatFilter) {
      return false;
    }

    // 3. Search query (nama kelas, mapel aktif, atau nama guru aktif)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchKelas = item.namaKelas.toLowerCase().includes(q);
      const matchMapel = item.sesiAktif?.mataPelajaran.toLowerCase().includes(q) || false;
      const matchGuru = item.sesiAktif?.guruNama.toLowerCase().includes(q) || false;
      return matchKelas || matchMapel || matchGuru;
    }

    return true;
  });

  const paginatedKelas = filteredKelas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <FullScreenLoader bgClass="bg-[#f8fafc]" />;
  }

  const summary = data?.summary || {
    totalKelas: 0,
    sedangDigunakan: 0,
    kosong: 0,
    isOperasional: true,
    keteranganOperasional: null,
    jamSekarangWIB: timeString || "—",
    tanggalWIB: dateString || "—",
    hariWIB: "—",
  };

  const statCardItems: StatCardItem[] = [
    {
      id: "total",
      label: "Total Ruang Kelas",
      value: `${summary.totalKelas} Kelas`,
      bgIcon: "bg-indigo-600",
      shadowIcon: "shadow-indigo-500/20",
      icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => setStatusFilter("semua"),
      active: statusFilter === "semua",
    },
    {
      id: "digunakan",
      label: "Sedang Digunakan",
      value: `${summary.sedangDigunakan} Kelas`,
      bgIcon: "bg-emerald-500",
      shadowIcon: "shadow-emerald-500/20",
      icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => setStatusFilter(statusFilter === "sedang_digunakan" ? "semua" : "sedang_digunakan"),
      active: statusFilter === "sedang_digunakan",
    },
    {
      id: "kosong",
      label: "Kelas Kosong",
      value: `${summary.kosong} Kelas`,
      bgIcon: "bg-slate-600",
      shadowIcon: "shadow-slate-500/20",
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />,
      onClick: () => setStatusFilter(statusFilter === "kosong" ? "semua" : "kosong"),
      active: statusFilter === "kosong",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8 animate-page-enter">
      
      {/* ── HEADER ROW (Selaras dengan Dashboard & Laporan) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Monitoring Kelas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau keterisian dan kegiatan belajar mengajar di seluruh ruang kelas secara real-time (WIB).
          </p>

          {/* Realtime Clock & Date for Mobile (< sm) */}
          <div className="flex sm:hidden items-center gap-2 mt-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeString}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[200px]">{dateString}</span>
            </div>
          </div>
        </div>

        {/* Top Badges & Refresh Button for Desktop (sm+) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
            <Clock className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
            <Calendar className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Segarkan data monitoring"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Menyinkron..." : "Segarkan"}</span>
          </button>
        </div>
      </div>

      {/* ── Banner Status Libur / Non-Operasional (Jika Ada) ──── */}
      {!summary.isOperasional && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-amber-900">
            <p className="font-bold">Mode Non-Operasional / Hari Libur</p>
            <p className="text-amber-800 mt-0.5">
              {summary.keteranganOperasional || "Hari ini adalah hari libur sekolah. Seluruh kegiatan belajar mengajar ditiadakan dan semua ruang kelas berstatus Kosong."}
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs md:text-sm text-rose-800 font-medium">{errorMsg}</p>
        </div>
      )}

      {/* ── Kartu Ringkasan Statistik ────────────────────────── */}
      <ScrollingStatCards
        items={statCardItems}
        loading={loading}
        desktopGridCols="lg:grid-cols-3"
      />

      {/* ── Filter Bar & Pencarian ───────────────────────────── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Input Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kelas, mata pelajaran, atau guru pengajar..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Unified Horizontal Scroll Filter Group (Status + Tingkat) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Status Pills */}
            <button
              type="button"
              onClick={() => setStatusFilter("semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === "semua"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Semua ({summary.totalKelas})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("sedang_digunakan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === "sedang_digunakan"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/60"
              }`}
            >
              Digunakan ({summary.sedangDigunakan})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("kosong")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === "kosong"
                  ? "bg-slate-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Kosong ({summary.kosong})
            </button>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 flex-shrink-0 mx-1" />

            {/* Tingkat Pills */}
            {["semua", "7", "8", "9"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTingkatFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  tingkatFilter === t
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {t === "semua" ? "Semua" : `Kls ${t}`}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ── Heading Section: Daftar Ruang Kelas ─────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-4 pt-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Daftar Ruang Kelas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredKelas.length} ruang kelas ditemukan
          </p>
        </div>
      </div>

      {/* ── Tabel Monitoring Ruang Kelas (Mobile & Desktop) ──── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-6 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px] sm:min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="pb-2.5 sm:pb-4 font-semibold text-center w-10 hidden sm:table-cell">NO</th>
                <th className="pb-2.5 sm:pb-4 font-semibold">RUANG KELAS</th>
                <th className="pb-2.5 sm:pb-4 font-semibold">STATUS</th>
                <th className="pb-2.5 sm:pb-4 font-semibold">MATA PELAJARAN</th>
                <th className="pb-2.5 sm:pb-4 font-semibold">GURU PENGAJAR</th>
                <th className="pb-2.5 sm:pb-4 font-semibold hidden sm:table-cell">JAM PELAJARAN</th>
                <th className="pb-2.5 sm:pb-4 font-semibold">PRESENSI</th>
                <th className="pb-2.5 sm:pb-4 font-semibold text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedKelas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 sm:py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada ruang kelas yang sesuai dengan filter.</p>
                      <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau reset filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedKelas.map((item, index) => {
                  const isDigunakan = item.statusRuang === "sedang_digunakan";
                  const sesi = item.sesiAktif;
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={item.kelasId}
                      onClick={() => setSelectedKelas(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* No */}
                      <td className="py-3 sm:py-4 text-center font-medium text-slate-400 hidden sm:table-cell">
                        {rowNumber}
                      </td>

                      {/* Ruang Kelas */}
                      <td className="py-3 sm:py-4 pr-2">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.namaKelas}
                        </span>
                      </td>

                      {/* Status Ruang */}
                      <td className="py-3 sm:py-4 pr-2">
                        <span
                          className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                            isDigunakan
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              isDigunakan ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {item.statusRuangLabel}
                        </span>
                      </td>

                      {/* Mata Pelajaran Aktif (+ Jam on mobile) */}
                      <td className="py-3 sm:py-4 pr-2 font-medium">
                        {isDigunakan && sesi ? (
                          <div>
                            <span className="font-semibold text-slate-900 block truncate max-w-[140px] sm:max-w-none">
                              {sesi.mataPelajaran}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal sm:hidden mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>{sesi.jamMulai} - {sesi.jamSelesai}</span>
                            </span>
                          </div>
                        ) : item.sesiBerikutnya ? (
                          <div>
                            <span className="text-slate-400 font-normal italic text-xs">—</span>
                            <span className="text-[11px] text-slate-400 font-normal sm:hidden block mt-0.5">
                              Berikutnya: {item.sesiBerikutnya.jamMulai}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">—</span>
                        )}
                      </td>

                      {/* Guru Pengajar */}
                      <td className="py-3 sm:py-4 pr-2">
                        {isDigunakan && sesi ? (
                          <div>
                            <p className="font-semibold text-slate-800 truncate max-w-[130px] sm:max-w-[200px]">
                              {sesi.guruNama}
                            </p>
                            {sesi.guruNip && (
                              <p className="text-[10px] text-slate-400 hidden sm:block">NIP: {sesi.guruNip}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">—</span>
                        )}
                      </td>

                      {/* Jam Pelajaran (Desktop sm+) */}
                      <td className="py-3 sm:py-4 pr-2 font-medium text-slate-700 whitespace-nowrap hidden sm:table-cell">
                        {isDigunakan && sesi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                            <Clock className="w-3 h-3" />
                            {sesi.jamMulai} - {sesi.jamSelesai}
                          </span>
                        ) : item.sesiBerikutnya ? (
                          <span className="text-slate-400 text-xs">
                            Sesi berikutnya: {item.sesiBerikutnya.jamMulai}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">—</span>
                        )}
                      </td>

                      {/* Status Presensi */}
                      <td className="py-3 sm:py-4 pr-2">
                        {isDigunakan && sesi ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                              sesi.statusPresensi === "sudah_presensi"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : sesi.statusPresensi === "tidak_mengajar"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {sesi.statusPresensi === "sudah_presensi" && <CheckCircle2 className="w-3 h-3" />}
                            {sesi.statusPresensi === "tidak_mengajar" && <AlertCircle className="w-3 h-3" />}
                            {sesi.statusPresensi === "belum_presensi" && <AlertTriangle className="w-3 h-3" />}
                            {sesi.statusPresensiLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-xs">—</span>
                        )}
                      </td>

                      {/* Aksi (Detail) */}
                      <td className="py-3 sm:py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKelas(item);
                          }}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold text-xs transition-all cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
                          title="Lihat detail kegiatan belajar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredKelas.length > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredKelas.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* ── Modal Detail Kegiatan Belajar ────────────────────── */}
      {selectedKelas && (
        <MonitoringDetailModal
          kelas={selectedKelas}
          onClose={() => setSelectedKelas(null)}
          hariLabel={summary.hariWIB}
          tanggalLabel={summary.tanggalWIB}
        />
      )}

    </div>
  );
}


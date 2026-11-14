"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Search, RefreshCw, Layers, CheckCircle2, AlertCircle, Clock, Eye, Info, AlertTriangle } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import FullScreenLoader from "@/components/ui/full-screen-loader";
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

  return (
    <div className="space-y-6">
      
      {/* ── Header Halaman ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Monitoring Kelas
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pantau keterisian dan kegiatan belajar mengajar di seluruh ruang kelas secara real-time (WIB).
          </p>
        </div>

        {/* Indikator Jam WIB & Tombol Refresh */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-right">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              WAKTU WIB
            </p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">
              {timeString || summary.jamSekarangWIB} WIB
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs md:text-sm font-semibold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Kelas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ruang Kelas
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              {summary.totalKelas}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh kelas terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Sedang Digunakan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Sedang Digunakan
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 mt-1">
              {summary.sedangDigunakan}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">KBM sedang berlangsung</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Card 3: Kosong */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Kelas Kosong
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-700 mt-1">
              {summary.kosong}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada jadwal aktif</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Pencarian ───────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
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

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter("semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === "semua"
                  ? "bg-slate-800 text-white shadow-xs"
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
                  ? "bg-emerald-600 text-white shadow-xs"
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
                  ? "bg-slate-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Kosong ({summary.kosong})
            </button>
          </div>

          {/* Filter Tingkat */}
          <div className="flex items-center gap-1.5 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Tingkat:
            </span>
            {["semua", "7", "8", "9"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTingkatFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tingkatFilter === t
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {t === "semua" ? "Semua" : `Kls ${t}`}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ── Tabel Monitoring Ruang Kelas ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Ruang Kelas</th>
                <th className="py-3.5 px-4">Status Ruang</th>
                <th className="py-3.5 px-4">Mata Pelajaran Aktif</th>
                <th className="py-3.5 px-4">Guru Pengajar</th>
                <th className="py-3.5 px-4">Jam Pelajaran</th>
                <th className="py-3.5 px-4">Presensi Mengajar</th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
              {paginatedKelas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
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
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer group ${
                        isDigunakan ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {rowNumber}
                      </td>

                      {/* Ruang Kelas */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.namaKelas}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Tingkat {item.tingkat}
                        </span>
                      </td>

                      {/* Status Ruang */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
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

                      {/* Mata Pelajaran Aktif */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {isDigunakan && sesi ? (
                          <span className="text-slate-900">{sesi.mataPelajaran}</span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">—</span>
                        )}
                      </td>

                      {/* Guru Pengajar */}
                      <td className="py-3.5 px-4">
                        {isDigunakan && sesi ? (
                          <div>
                            <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                              {sesi.guruNama}
                            </p>
                            {sesi.guruNip && (
                              <p className="text-[11px] text-slate-400">NIP: {sesi.guruNip}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">—</span>
                        )}
                      </td>

                      {/* Jam Pelajaran */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
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
                          <span className="text-slate-400 font-normal italic">—</span>
                        )}
                      </td>

                      {/* Status Presensi */}
                      <td className="py-3.5 px-4">
                        {isDigunakan && sesi ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                          <span className="text-slate-400 font-normal italic">—</span>
                        )}
                      </td>

                      {/* Aksi (Detail) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKelas(item);
                          }}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold text-xs transition-all cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
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
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredKelas.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              size="md"
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


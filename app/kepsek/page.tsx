"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import Pagination from "@/components/ui/pagination";
import { Search, Camera } from "lucide-react";
import {
  getKepsekStats,
  getKehadiranHariIni,
  getMengajarHariIni,
  KepsekStats,
  KehadiranHariIni,
  MengajarHariIni,
} from "@/actions/dashboard";
import { getStatusColorText } from "@/lib/status";
import { PhotoOverlay } from "@/components/kepsek/PhotoOverlay";
import { ScrollingStatCards, StatCardItem } from "@/components/ui/ScrollingStatCards";

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "hadir" || s === "mengajar") return "bg-blue-50 text-blue-700 border-blue-200/80";
  if (s === "izin") return "bg-orange-50 text-orange-700 border-orange-200/80";
  if (s === "sakit") return "bg-rose-50 text-rose-700 border-rose-200/80";
  if (s.includes("dinas")) return "bg-teal-50 text-teal-700 border-teal-200/80";
  if (s.includes("tidak")) return "bg-purple-50 text-purple-700 border-purple-200/80";
  if (s.includes("belum")) return "bg-slate-100 text-slate-600 border-slate-200/80";
  return "bg-slate-50 text-slate-700 border-slate-200/80";
}

export default function KepsekDashboardPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [stats, setStats] = useState<KepsekStats>({
    guruHadir: 0,
    izin: 0,
    sakit: 0,
    dinas: 0,
    belumAbsen: 0,
  });
  const [kehadiran, setKehadiran] = useState<KehadiranHariIni[]>([]);
  const [mengajar, setMengajar] = useState<MengajarHariIni[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoOverlayUrl, setPhotoOverlayUrl] = useState<string | null>(null);

  // Responsive pagination: 2 cards on mobile (<768px), 10 items on desktop
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const itemsPerPage = isMobile ? 4 : 10;

  // Pagination states & Search states
  const [currentPageKehadiran, setCurrentPageKehadiran] = useState(1);
  const [currentPageMengajar, setCurrentPageMengajar] = useState(1);
  const [searchKehadiran, setSearchKehadiran] = useState("");
  const [searchMengajar, setSearchMengajar] = useState("");



  // Reset pagination if screen mode or search changes
  useEffect(() => {
    setCurrentPageKehadiran(1);
    setCurrentPageMengajar(1);
  }, [isMobile]);

  useEffect(() => {
    setCurrentPageKehadiran(1);
  }, [searchKehadiran]);

  useEffect(() => {
    setCurrentPageMengajar(1);
  }, [searchMengajar]);

  // Filter Kehadiran
  const filteredKehadiran = kehadiran.filter(row => 
    row.nama_guru.toLowerCase().includes(searchKehadiran.toLowerCase()) ||
    row.status.toLowerCase().includes(searchKehadiran.toLowerCase())
  );

  // Filter Mengajar
  const filteredMengajar = mengajar.filter(row => 
    row.nama_guru.toLowerCase().includes(searchMengajar.toLowerCase()) ||
    row.kelas.toLowerCase().includes(searchMengajar.toLowerCase()) ||
    row.mata_pelajaran.toLowerCase().includes(searchMengajar.toLowerCase()) ||
    row.status.toLowerCase().includes(searchMengajar.toLowerCase())
  );

  const paginatedKehadiran = filteredKehadiran.slice(
    (currentPageKehadiran - 1) * itemsPerPage,
    currentPageKehadiran * itemsPerPage
  );

  const paginatedMengajar = filteredMengajar.slice(
    (currentPageMengajar - 1) * itemsPerPage,
    currentPageMengajar * itemsPerPage
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, hadirData, mengajarData] = await Promise.all([
          getKepsekStats(),
          getKehadiranHariIni(),
          getMengajarHariIni(),
        ]);
        setStats(statsData);
        setKehadiran(hadirData);
        setMengajar(mengajarData);
      } catch (err) {
        console.error("Gagal memuat data dashboard kepsek:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const statCardItems: StatCardItem[] = [
    {
      id: "hadir",
      label: "Guru Hadir",
      value: stats.guruHadir,
      bgIcon: "bg-indigo-600",
      shadowIcon: "shadow-indigo-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        </svg>
      ),
    },
    {
      id: "izin",
      label: "Izin",
      value: stats.izin,
      bgIcon: "bg-orange-500",
      shadowIcon: "shadow-orange-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
          <rect width="14" height="18" x="5" y="3" rx="3" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </svg>
      ),
    },
    {
      id: "sakit",
      label: "Sakit",
      value: stats.sakit,
      bgIcon: "bg-rose-500",
      shadowIcon: "shadow-rose-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
          <rect width="18" height="18" x="3" y="4" rx="3" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M10 16h4" />
          <path d="M12 14v4" />
        </svg>
      ),
    },
    {
      id: "dinas",
      label: "Dinas Luar",
      value: stats.dinas,
      bgIcon: "bg-teal-500",
      shadowIcon: "shadow-teal-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: "belumAbsen",
      label: "Belum Absen",
      value: stats.belumAbsen,
      bgIcon: "bg-purple-600",
      shadowIcon: "shadow-purple-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
          <rect width="18" height="14" x="3" y="5" rx="3" />
          <path d="M3 10h18" />
          <path d="m15 15 4 4" />
          <path d="m19 15-4 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Dashboard Kepala Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau kondisi kehadiran guru secara menyeluruh.
          </p>

          {/* Realtime Clock & Date for Mobile (< sm) */}
          <div className="flex sm:hidden items-center gap-2 mt-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-500">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{timeString}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-500">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="truncate max-w-[200px]">{dateString}</span>
            </div>
          </div>
        </div>

        {/* Top Badges (Waktu & Tanggal Realtime) for Desktop (sm+) */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Jam Badge */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>

          {/* Tanggal Badge */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <ScrollingStatCards
        items={statCardItems}
        loading={loading}
        desktopGridCols="lg:grid-cols-5"
      />

      {/* ── TABEL & CARD: ABSENSI KEHADIRAN HARI INI ── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3.5 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Absensi Kehadiran Hari Ini
            </h2>
            <p className="text-xs text-slate-500 sm:hidden mt-0.5">
              {filteredKehadiran.length} data ditemukan
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari guru atau status..."
              value={searchKehadiran}
              onChange={(e) => setSearchKehadiran(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Mobile Card List (< md) */}
        <div className="md:hidden space-y-2.5">
          {filteredKehadiran.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-400 font-medium text-sm shadow-sm">
              {loading ? "Memuat kehadiran..." : "Belum ada catatan presensi hari ini."}
            </div>
          ) : (
            <div className="space-y-2.5">
              {paginatedKehadiran.map((row) => (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">
                      {row.nama_guru}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">{row.waktu_masuk ?? "—"}</span>
                      {row.status.toLowerCase() === "hadir" && row.waktu_masuk && row.keterangan_terlambat && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap ${
                            row.terlambat
                              ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${row.terlambat ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {row.keterangan_terlambat}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(row.foto_absensi || row.file_bukti_izin_sakit) && (
                      <button
                        type="button"
                        onClick={() => setPhotoOverlayUrl((row.foto_absensi || row.file_bukti_izin_sakit)!)}
                        className="border border-blue-200 bg-blue-50 text-blue-600 rounded-lg p-1.5 hover:bg-blue-100 transition-colors flex items-center justify-center active:scale-95"
                        title="Lihat Foto / Bukti"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getStatusBadge(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredKehadiran.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm [&>div]:mt-0 [&>div]:pt-0 [&>div]:border-t-0">
              <Pagination
                size="sm"
                currentPage={currentPageKehadiran}
                totalItems={filteredKehadiran.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPageKehadiran}
              />
            </div>
          )}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="pb-2.5 sm:pb-4 font-semibold w-[32%]">NAMA GURU</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[38%]">WAKTU MASUK</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[15%]">STATUS</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[15%] text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredKehadiran.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                    {loading ? "Memuat kehadiran..." : "Belum ada catatan presensi hari ini."}
                  </td>
                </tr>
              ) : (
                paginatedKehadiran.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 sm:py-4 font-semibold text-slate-800">
                      {row.nama_guru}
                    </td>
                    <td className="py-2.5 sm:py-4 text-slate-700 font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{row.waktu_masuk ?? "—"}</span>
                        {row.status.toLowerCase() === "hadir" && row.waktu_masuk && row.keterangan_terlambat && (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap ${
                              row.terlambat
                                ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${row.terlambat ? "bg-rose-500" : "bg-emerald-500"}`} />
                            {row.keterangan_terlambat}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-2.5 sm:py-4 font-semibold ${getStatusColorText(row.status)}`}>
                      {row.status}
                    </td>
                    <td className="py-2.5 sm:py-4 text-center">
                      {(row.foto_absensi || row.file_bukti_izin_sakit) ? (
                        <button
                          type="button"
                          onClick={() => setPhotoOverlayUrl((row.foto_absensi || row.file_bukti_izin_sakit)!)}
                          className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-blue-100 transition-colors active:scale-95"
                          title="Lihat Foto / Bukti"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Foto</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filteredKehadiran.length > 0 && (
            <Pagination
              size="sm"
              currentPage={currentPageKehadiran}
              totalItems={filteredKehadiran.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPageKehadiran}
            />
          )}
        </div>
      </div>

      {/* ── TABEL & CARD: ABSENSI MENGAJAR HARI INI ── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3.5 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Absensi Mengajar Hari Ini
            </h2>
            <p className="text-xs text-slate-500 sm:hidden mt-0.5">
              {filteredMengajar.length} data ditemukan
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari kelas atau mapel..."
              value={searchMengajar}
              onChange={(e) => setSearchMengajar(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Mobile Card List (< md) */}
        <div className="md:hidden space-y-2.5">
          {filteredMengajar.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-400 font-medium text-sm shadow-sm">
              {loading ? "Memuat absensi mengajar..." : "Belum ada catatan absensi mengajar hari ini."}
            </div>
          ) : (
            <div className="space-y-2.5">
              {paginatedMengajar.map((row) => (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        {row.nama_guru}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {row.mata_pelajaran} • {row.kelas}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {row.foto_absensi && (
                        <button
                          type="button"
                          onClick={() => setPhotoOverlayUrl(row.foto_absensi!)}
                          className="border border-blue-200 bg-blue-50 text-blue-600 rounded-lg p-1.5 hover:bg-blue-100 transition-colors flex items-center justify-center active:scale-95"
                          title="Lihat Foto"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getStatusBadge(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Jam KBM:</span>
                      <span className="font-semibold text-slate-700">{row.jam_mengajar}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Absen:</span>
                      <span className="font-semibold text-slate-700">{row.waktu_absen}</span>
                      {row.keterangan_terlambat && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap ${
                            row.terlambat
                              ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${row.terlambat ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {row.keterangan_terlambat}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredMengajar.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm [&>div]:mt-0 [&>div]:pt-0 [&>div]:border-t-0">
              <Pagination
                size="sm"
                currentPage={currentPageMengajar}
                totalItems={filteredMengajar.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPageMengajar}
              />
            </div>
          )}
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px] sm:min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="pb-2.5 sm:pb-4 font-semibold w-[20%]">NAMA GURU</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[18%]">MATA PELAJARAN</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[10%]">KELAS</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[20%]">WAKTU ABSENSI</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[11%]">JAM MENGAJAR</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[11%]">STATUS</th>
                <th className="pb-2.5 sm:pb-4 font-semibold w-[10%] text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredMengajar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                    {loading ? "Memuat absensi mengajar..." : "Belum ada catatan absensi mengajar hari ini."}
                  </td>
                </tr>
              ) : (
                paginatedMengajar.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 sm:py-4 font-semibold text-slate-800">
                      {row.nama_guru}
                    </td>
                    <td className="py-2.5 sm:py-4 text-slate-500 font-medium">
                      {row.mata_pelajaran}
                    </td>
                    <td className="py-2.5 sm:py-4 text-slate-500 font-medium">
                      {row.kelas}
                    </td>
                    <td className="py-2.5 sm:py-4 text-slate-700 font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{row.waktu_absen}</span>
                        {row.keterangan_terlambat && (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap ${
                              row.terlambat
                                ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${row.terlambat ? "bg-rose-500" : "bg-emerald-500"}`} />
                            {row.keterangan_terlambat}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-4 text-slate-500 font-medium">
                      {row.jam_mengajar}
                    </td>
                    <td className={`py-2.5 sm:py-4 font-semibold ${getStatusColorText(row.status)}`}>
                      {row.status}
                    </td>
                    <td className="py-2.5 sm:py-4 text-center">
                      {row.foto_absensi ? (
                        <button
                          type="button"
                          onClick={() => setPhotoOverlayUrl(row.foto_absensi!)}
                          className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-blue-100 transition-colors active:scale-95"
                          title="Lihat Foto"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Foto</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && filteredMengajar.length > 0 && (
            <Pagination
              size="sm"
              currentPage={currentPageMengajar}
              totalItems={filteredMengajar.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPageMengajar}
            />
          )}
        </div>
      </div>

      {/* ── PHOTO OVERLAY MODAL ── */}
      <PhotoOverlay
        photoUrl={photoOverlayUrl}
        onClose={() => setPhotoOverlayUrl(null)}
      />
    </div>
  );
}


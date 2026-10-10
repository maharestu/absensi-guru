"use client";

import React, { useState, useEffect } from "react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import Pagination from "@/components/ui/pagination";
import {
  getKepsekStats,
  getKehadiranHariIni,
  getMengajarHariIni,
  KepsekStats,
  KehadiranHariIni,
  MengajarHariIni,
} from "@/actions/dashboard";

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

  // Pagination states
  const [currentPageKehadiran, setCurrentPageKehadiran] = useState(1);
  const [currentPageMengajar, setCurrentPageMengajar] = useState(1);
  const itemsPerPage = 11;

  const paginatedKehadiran = kehadiran.slice(
    (currentPageKehadiran - 1) * itemsPerPage,
    currentPageKehadiran * itemsPerPage
  );

  const paginatedMengajar = mengajar.slice(
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

  

  return (
    <div className="space-y-8">
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Dashboard Kepala Sekolah
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau kondisi kehadiran guru secara menyeluruh.
          </p>
        </div>

        {/* Top Badges (Waktu & Tanggal Realtime) */}
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {/* Card 1: Guru Hadir */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="4" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Guru Hadir</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.guruHadir}
            </h2>
          </div>
        </div>

        {/* Card 2: Izin */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="18" x="5" y="3" rx="3" />
              <path d="M9 9h6" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Izin</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.izin}
            </h2>
          </div>
        </div>

        {/* Card 3: Sakit */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-rose-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.sakit}
            </h2>
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.dinas}
            </h2>
          </div>
        </div>

        {/* Card: Belum Absen */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="14" x="3" y="5" rx="3" />
              <path d="M3 10h18" />
              <path d="m15 15 4 4" />
              <path d="m19 15-4 4" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Belum Absen</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.belumAbsen}
            </h2>
          </div>
        </div>
      </div>

      {/* ── TABEL: ABSENSI KEHADIRAN HARI INI ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Absensi Kehadiran Hari Ini</h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="pb-4 font-semibold w-[45%]">NAMA GURU</th>
                <th className="pb-4 font-semibold w-[30%]">WAKTU MASUK</th>
                <th className="pb-4 font-semibold w-[25%]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {kehadiran.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400 font-medium">
                    {loading ? "Memuat kehadiran..." : "Belum ada catatan presensi hari ini."}
                  </td>
                </tr>
              ) : (
                paginatedKehadiran.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 font-semibold text-slate-800">
                      {row.nama_guru}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {row.waktu_masuk ?? "—"}
                    </td>
                    <td className="py-4 font-medium text-slate-600">
                      {row.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && kehadiran.length > 0 && (
            <Pagination
              currentPage={currentPageKehadiran}
              totalItems={kehadiran.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPageKehadiran}
            />
          )}

        </div>
      </div>

      {/* ── TABEL: ABSENSI MENGAJAR HARI INI ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Absensi Mengajar Hari Ini</h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="pb-4 font-semibold w-[25%]">NAMA GURU</th>
                <th className="pb-4 font-semibold w-[20%]">MATA PELAJARAN</th>
                <th className="pb-4 font-semibold w-[15%]">KELAS</th>
                <th className="pb-4 font-semibold w-[20%]">JAM MENGAJAR</th>
                <th className="pb-4 font-semibold w-[20%]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {mengajar.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                    {loading ? "Memuat absensi mengajar..." : "Belum ada catatan absensi mengajar hari ini."}
                  </td>
                </tr>
              ) : (
                paginatedMengajar.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 font-semibold text-slate-800">
                      {row.nama_guru}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {row.mata_pelajaran}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {row.kelas}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {row.jam_mengajar}
                    </td>
                    <td className="py-4 font-medium text-emerald-600">
                      {row.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && mengajar.length > 0 && (
            <Pagination
              currentPage={currentPageMengajar}
              totalItems={mengajar.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPageMengajar}
            />
          )}



        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { getAdminStats, getRecentActivities, AdminStats, ActivityItem } from "@/actions/dashboard";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import Pagination from "@/components/ui/pagination";
import { Search } from "lucide-react";

export default function AdminDashboardPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [stats, setStats] = useState<AdminStats>({
    totalGuru: 0,
    totalJadwal: 0,
    totalAkun: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk paginasi & pencarian
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 11;

  // Filter data aktivitas
  const filteredActivities = activities.filter((act) => 
    act.aktivitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.pengguna.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.waktu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Memotong data sesuai halaman
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset halaman jika search query berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, actData] = await Promise.all([
          getAdminStats(),
          getRecentActivities(),
        ]);
        setStats(statsData);
        setActivities(actData);
      } catch (err) {
        console.error("Gagal memuat data dashboard admin:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* ── HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan pengelolaan data sekolah.
          </p>
        </div>

        {/* Top Badges (Waktu & Tanggal Realtime) */}
        <div className="flex items-center gap-3">
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

      {/* ── STAT CARDS (3 Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {/* Card 1: Total Guru */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Total Guru</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.totalGuru}
            </h2>
          </div>
        </div>

        {/* Card 2: Total Jadwal */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2" />
              <path d="M16 2V6M8 2V6M3 10H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 14H10M14 14H16M8 18H10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Total Jadwal</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.totalJadwal}
            </h2>
          </div>
        </div>

        {/* Card 3: Total Akun */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm flex items-center gap-3 sm:gap-4 w-full col-span-2 lg:col-span-1">
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
              <path d="M6.168 18.849C7.488 17.11 9.608 16 12 16C14.392 16 16.512 17.11 17.832 18.849" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Total Akun</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {loading ? "..." : stats.totalAkun}
            </h2>
          </div>
        </div>
      </div>

      {/* ── AKTIVITAS TERBARU TABLE ── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Aktivitas Terbaru</h2>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="pb-4 font-semibold w-[35%]">AKTIVITAS</th>
                <th className="pb-4 font-semibold w-[25%]">PENGGUNA</th>
                <th className="pb-4 font-semibold w-[20%]">WAKTU</th>
                <th className="pb-4 font-semibold w-[20%]">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                    {loading ? "Memuat aktivitas..." : "Belum ada aktivitas tercatat hari ini."}
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 font-semibold text-slate-800">
                      {act.aktivitas}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {act.pengguna}
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {act.waktu}
                    </td>
                    <td className="py-4 font-medium text-emerald-600">
                      {act.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
        </table>
        
        {/* Komponen Paginasi */}
        {!loading && filteredActivities.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredActivities.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
      </div>
    </div>
  );
}

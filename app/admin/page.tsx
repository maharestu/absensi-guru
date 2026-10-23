"use client";

import React, { useState, useEffect } from "react";
import { getAdminStats, getRecentActivities, AdminStats, ActivityItem } from "@/actions/dashboard";
import { ClockBadges } from "@/components/admin/ui/ClockBadges";
import Pagination from "@/components/ui/pagination";
import { Search } from "lucide-react";

import { ScrollingStatCards, StatCardItem } from "@/components/ui/ScrollingStatCards";

export default function AdminDashboardPage() {
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

  const statCards: StatCardItem[] = [
    {
      id: "total-guru",
      label: "Total Guru",
      value: stats.totalGuru,
      bgIcon: "bg-blue-600",
      shadowIcon: "shadow-blue-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "total-jadwal",
      label: "Total Jadwal",
      value: stats.totalJadwal,
      bgIcon: "bg-purple-600",
      shadowIcon: "shadow-purple-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2" />
          <path d="M16 2V6M8 2V6M3 10H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 14H10M14 14H16M8 18H10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "total-akun",
      label: "Total Akun",
      value: stats.totalAkun,
      bgIcon: "bg-emerald-600",
      shadowIcon: "shadow-emerald-500/20",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
          <path d="M6.168 18.849C7.488 17.11 9.608 16 12 16C14.392 16 16.512 17.11 17.832 18.849" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

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

        <ClockBadges />
      </div>

      {/* ── STAT CARDS (3 Cards) ── */}
      <ScrollingStatCards
        items={statCards}
        loading={loading}
        desktopGridCols="lg:grid-cols-3"
      />

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
                <th className="pb-4 font-semibold w-[22%]">AKTIVITAS</th>
                <th className="pb-4 font-semibold w-[36%]">PENGGUNA</th>
                <th className="pb-4 font-semibold w-[22%]">WAKTU</th>
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

"use client";

import React from "react";
import { MOCK_ADMIN_STATS, MOCK_ADMIN_ACTIVITIES } from "@/lib/mock-data";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";

export default function AdminDashboardPage() {
  const { timeString, dateString } = useRealtimeClock();

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

      {/* ── STAT CARDS (3 Cards - Dynamic Responsive Fluid width) ── */}
      <div className="flex flex-wrap gap-4 lg:gap-5 justify-start items-center">
        {/* Card 1: Total Guru */}
        <div className="flex-1 min-w-[220px] max-w-[290px] bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Guru Terdaftar</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {MOCK_ADMIN_STATS.totalGuru}
            </h2>
          </div>
        </div>

        {/* Card 2: Total Jadwal */}
        <div className="flex-1 min-w-[220px] max-w-[290px] bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-purple-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2" />
              <path d="M16 2V6M8 2V6M3 10H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 14H10M14 14H16M8 18H10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Jadwal Terdaftar</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {MOCK_ADMIN_STATS.totalJadwal}
            </h2>
          </div>
        </div>

        {/* Card 3: Total Akun */}
        <div className="flex-1 min-w-[220px] max-w-[290px] bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-emerald-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="white" strokeWidth="2" />
              <path d="M6.168 18.849C7.488 17.11 9.608 16 12 16C14.392 16 16.512 17.11 17.832 18.849" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Akun Terdaftar</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {MOCK_ADMIN_STATS.totalAkun}
            </h2>
          </div>
        </div>
      </div>

      {/* ── AKTIVITAS TERBARU TABLE ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Aktivitas Terbaru</h2>

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
              {MOCK_ADMIN_ACTIVITIES.map((act) => (
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
                  <td className="py-4 font-medium text-slate-600">
                    {act.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


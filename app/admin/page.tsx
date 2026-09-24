import React from "react";

/**
 * PAGE PLACEHOLDER - DASHBOARD ADMIN
 * 
 * Modul ini disiapkan untuk fase pengembangan selanjutnya (Admin Desktop Dashboard).
 */
export default function AdminPage() {
  return (
    <main className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center text-center">
      <div className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Portal Admin Sekolah</h1>
        <p className="text-sm text-slate-500 mb-4">
          Halaman ini disiapkan untuk antarmuka manajemen Admin (Kelola Guru, Ruangan, QR Code, Jadwal, & Laporan).
        </p>
        <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
          Dalam Pengembangan Fase Berikutnya
        </span>
      </div>
    </main>
  );
}

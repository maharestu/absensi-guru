import React from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 font-bold text-lg text-slate-800">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="block px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/master"
            className="block px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
          >
            Master Data
          </Link>
          <Link
            href="/admin/laporan"
            className="block px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
          >
            Laporan
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between md:justify-end">
          <div className="md:hidden font-bold text-slate-800">Admin Panel</div>
          <div className="text-sm font-medium text-slate-600">
            Profil Admin
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

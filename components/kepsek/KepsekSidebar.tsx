"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface KepsekSidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function KepsekSidebar({ isMobileMenuOpen = false, onCloseMobileMenu = () => {} }: KepsekSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const namaUser = user?.nama ?? "Kepala Sekolah";
  const initial = namaUser.charAt(0).toUpperCase();

  const navItems = [
    {
      label: "Dashboard",
      href: "/kepsek",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      label: "Laporan Absensi",
      href: "/kepsek/laporan",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Handle closing on route change for mobile
  React.useEffect(() => {
    onCloseMobileMenu();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-50 transition-transform duration-300 md:transition-none shadow-xl md:shadow-none ${
      isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    }`}>
      <div className="flex flex-col h-full overflow-hidden w-full p-4 lg:p-6 relative">
        
        {/* Mobile Close Button & Header */}
        <div className="md:hidden flex items-center justify-between mb-6 pt-2">
          <span className="font-bold text-slate-800 ml-1">Menu Kepsek</span>
          <button onClick={onCloseMobileMenu} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg active:scale-95">
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
               <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Profile Card Header */}
          <div className="bg-[#f0f4f9] p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
              <Image src="/Logo.png" alt="Logo SMPN 8 Karawang Barat" width={32} height={32} className="object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{namaUser}</p>
            </div>
          </div>

        {/* Section Label */}
        <div className="mt-8 mb-3 px-2">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            KEPALA SEKOLAH
          </p>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <span className={isActive ? "text-blue-600" : "text-slate-400"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="pt-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all text-left"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 17L15 12L10 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 12H3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Keluar
        </button>
      </div>
      </div>
    </aside>
  );
}

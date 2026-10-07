"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function AdminSidebar({ isMobileMenuOpen = false, onCloseMobileMenu = () => {} }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Resizable & Collapsible states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px
  const isResizing = useRef(false);
  const minWidth = 80;
  const maxWidth = 400;

  const namaUser = user?.nama ?? "Admin Sekolah";

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      label: "Kelola Data Guru",
      href: "/admin/guru",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <path d="M8 16v-4M12 16V8M16 16v-6" />
        </svg>
      ),
    },
    {
      label: "Kelola Jadwal",
      href: "/admin/jadwal",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <circle cx="18" cy="18" r="3" />
          <path d="M18 14v1M18 23v1M14 18h1M23 18h1M15.5 15.5l.5.5M20.5 20.5l.5.5M15.5 20.5l.5-.5M20.5 15.5l-.5.5" />
        </svg>
      ),
    },
    {
      label: "Kelola Akun",
      href: "/admin/akun",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="10" cy="10" r="3" />
          <path d="M5 18c0-3 3-5 5-5 1.7 0 3.2.7 4 1.8" />
          <circle cx="16" cy="12" r="2" />
          <path d="M14 18c0-2 1.5-3 3-3s3 1 3 3" />
        </svg>
      ),
    },
    {
      label: "Kelola Ruang Kelas",
      href: "/admin/kelas",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 18H19L21 9H3L5 18Z" />
          <path d="M7 21h10" />
        </svg>
      ),
    },
    {
      label: "Import Data",
      href: "/admin/import",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    // Auto-tutup sidebar mobile ketika pengguna pindah halaman
    onCloseMobileMenu();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      let newWidth = e.clientX;
      if (newWidth < minWidth + 20) {
        setIsCollapsed(true);
        newWidth = minWidth;
      } else {
        setIsCollapsed(false);
        if (newWidth > maxWidth) newWidth = maxWidth;
      }
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Tentukan lebar aktual yang dirender
  const actualWidth = isCollapsed ? minWidth : sidebarWidth;
  
  return (
    <>
      <aside 
        style={{ width: `var(--current-width)` }}
        className={`fixed md:relative top-0 left-0 h-full bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-50 transition-transform duration-300 md:transition-none shadow-xl md:shadow-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Style dinamis untuk menangani ukuran desktop vs mobile */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            aside { --current-width: ${actualWidth}px; }
          }
          @media (max-width: 767px) {
            aside { --current-width: 280px; }
          }
        `}} />
        
        {/* Content Wrapper */}
        <div className="flex flex-col h-full overflow-hidden w-full p-4 lg:p-5 relative select-none md:select-auto">
          
          {/* Mobile Close Button & Header */}
          <div className="md:hidden flex items-center justify-between mb-6 pt-2">
            <span className="font-bold text-slate-800 ml-1">Menu Admin</span>
            <button onClick={onCloseMobileMenu} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg active:scale-95">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                 <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {/* Header Profil */}
            <div className={`bg-[#f0f4f9] rounded-2xl flex items-center transition-all ${isCollapsed ? 'p-2 justify-center' : 'p-3.5 gap-3'}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white shadow-sm overflow-hidden">
                <Image src="/Logo.png" alt="Logo" width={32} height={32} className="object-contain" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 md:block hidden md:flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{namaUser}</p>
                  <p className="text-[11px] text-slate-500 truncate">Administrator</p>
                </div>
              )}
              {/* Fallback info profil untuk mobile karena md:flex-1 menyembunyikan div atas di mobile */}
              <div className="min-w-0 md:hidden flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{namaUser}</p>
              </div>
            </div>

            {/* Title / Collapse Toggle */}
            <div className={`mt-8 mb-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
              {!isCollapsed && (
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Menu Utama</p>
              )}
              
              {/* Collapse button for desktop only */}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                title={isCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {isCollapsed ? (
                    <path d="M13 5L20 12L13 19M5 5V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M11 5L4 12L11 19M19 5V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </button>
            </div>

            {/* Navigasi */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                      isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                    } ${
                      isActive
                      ? "bg-blue-50 text-blue-600 font-bold shadow-sm shadow-blue-100/50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-slate-100 mt-2">
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Keluar" : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3 text-left'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </div>
        </div>

        {/* Resizer Handle (Desktop Only) */}
        <div 
          onMouseDown={handleMouseDown}
          className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-10"
        />
      </aside>
    </>
  );
}

import React from "react";
import Image from "next/image";
import LogoutIconButton from "@/components/auth/logout-icon-button";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 */
export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-start items-center">
      {/* Wrapper Container */}
      <div className="w-full max-w-md min-h-screen bg-[#EEF2F7] relative flex flex-col overflow-hidden">
        {/* Top App Bar */}
        <header className="w-full bg-white px-5 py-3.5 flex items-center justify-between border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="Logo SMPN 8 Karawang Barat"
              width={38}
              height={38}
              className="object-contain drop-shadow-sm"
              priority
            />
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight">SMPN 8 Karawang Barat</h1>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Sistem Presensi Pendidik</p>
            </div>
          </div>
          <LogoutIconButton />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}


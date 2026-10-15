"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LogoutIconButton from "@/components/auth/logout-icon-button";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 * Dilengkapi dengan proteksi rute dan verifikasi role.
 */
export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "admin") {
        router.push("/admin");
      } else if (user?.role === "kepala_sekolah") {
        router.push("/kepsek");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "guru") {
    return (
      <div className="w-full min-h-screen bg-[#EEF2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-start items-center">
      {/* Wrapper Container */}
      <div className="w-full max-w-md min-h-screen bg-[#EEF2F7] relative flex flex-col shadow-xs">
        {/* Top App Bar — Fixed/Sticky di posisi atas */}
        <header className="w-full bg-white px-5 py-3.5 flex items-center justify-between border-b border-slate-200 sticky top-0 z-50 shadow-xs">
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
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}


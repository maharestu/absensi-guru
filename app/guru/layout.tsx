"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LogoutIconButton from "@/components/auth/logout-icon-button";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 * Menggunakan arsitektur App Shell dengan h-[100dvh] presisi agar tidak ada
 * phantom scroll ke area kosong pada mobile browser, sekaligus tetap mendukung
 * scrolling konten secara mulus pada perangkat berlayar kecil.
 */
export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

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

  // Reset scroll position ke atas setiap kali berpindah halaman
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  if (isLoading || !isAuthenticated || user?.role !== "guru") {
    return (
      <div className="w-full h-screen h-[100dvh] bg-[#EEF2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen h-[100dvh] bg-white flex flex-col justify-start items-center overflow-hidden">
      {/* Wrapper Container (Mobile Center Column) */}
      <div className="w-full max-w-md h-full bg-[#EEF2F7] relative flex flex-col shadow-xs overflow-hidden">
        {/* Top App Bar — Terkunci kokoh di posisi atas */}
        <header className="flex-shrink-0 w-full bg-white px-5 py-3.5 flex items-center justify-between border-b border-slate-200 z-50 shadow-xs">
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

        {/* Main Content Area — Scrollable hanya jika konten melebihi sisa tinggi layar */}
        <main ref={mainRef} className="flex-1 w-full overflow-y-auto overscroll-y-contain">
          {children}
        </main>
      </div>
    </div>
  );
}


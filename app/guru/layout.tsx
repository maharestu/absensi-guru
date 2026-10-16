"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GuruTopBar from "@/components/guru/GuruTopBar";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 * Mendukung natural document scrolling agar guru dapat bebas menggulir layar,
 * menggunakan gestur multi-touch (pinch-to-zoom 2 jari) tanpa risiko macet/terjebak,
 * dengan Top App Bar yang tetap sticky di bagian atas.
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
    window.scrollTo({ top: 0, behavior: "instant" });
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  if (isLoading || !isAuthenticated || user?.role !== "guru") {
    return (
      <div className="w-full min-h-screen min-h-[100dvh] bg-[#EEF2F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-[#EEF2F7] sm:bg-slate-200/70 flex flex-col justify-start items-center overflow-x-hidden">
      {/* Wrapper Container (Mobile Center Column) */}
      <div className="w-full max-w-md min-h-screen min-h-[100dvh] bg-[#EEF2F7] relative flex flex-col shadow-sm">
        {/* Top App Bar — Hanya tampil di Dashboard Guru (/guru) */}
        {pathname === "/guru" && <GuruTopBar />}

        {/* Main Content Area — Mengikuti natural scroll dokumen tanpa nested container trapping */}
        <main ref={mainRef} className="flex-1 w-full flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GuruTopBar from "@/components/guru/GuruTopBar";
import DevTestingToolbar from "@/components/dev/DevTestingToolbar";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import LiburPauseScreen from "@/components/absensi/libur-pause-screen";
import { getDevTestingConfigClient } from "@/lib/testing-mode";
import {
  getStatusOperasionalHariIni,
  StatusOperasionalHariIni,
} from "@/actions/pengaturan";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 * Dilengkapi Route Guard otomatis untuk mencegah akses URL sub-rute saat hari libur / libur panjang.
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
  // Inisialisasi sinkron dari cache session untuk menghilangkan flicker saat refresh
  const [statusOperasional, setStatusOperasional] = useState<StatusOperasionalHariIni | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
        const cached = sessionStorage.getItem(`op_cache_${todayStr}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    getStatusOperasionalHariIni()
      .then((res) => {
        setStatusOperasional(res);
        try {
          const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
          sessionStorage.setItem(`op_cache_${todayStr}`, JSON.stringify(res));
        } catch {}
      })
      .catch((err) => console.warn("getStatusOperasionalHariIni error:", err));
  }, [pathname]);

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

  const testConfig = getDevTestingConfigClient();
  const isHolidayPause = !testConfig.isActive && Boolean(statusOperasional && !statusOperasional.isOperasional);
  const isDirectUrlSubpage = pathname !== "/guru";

  // Tahan tampilan dengan FullScreenLoader jika status autentikasi ATAU status operasional belum ter-resolve.
  // Ini mencegah flash tampilan dashboard normal sesaat sebelum status libur selesai dimuat saat user baru login (cold visit).
  if (
    isLoading ||
    !isAuthenticated ||
    user?.role !== "guru" ||
    (statusOperasional === null && !testConfig.isActive)
  ) {
    return <FullScreenLoader bgClass="bg-[#EEF2F7]" />;
  }

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-[#EEF2F7] sm:bg-slate-200/70 flex flex-col justify-start items-center overflow-x-hidden">
      {/* Wrapper Container (Mobile Center Column) */}
      <div className="w-full max-w-md min-h-screen min-h-[100dvh] bg-[#EEF2F7] relative flex flex-col shadow-sm pb-12 sm:pb-8">
        {/* Top App Bar — Hanya tampil di Dashboard Guru (/guru) */}
        {pathname === "/guru" && <GuruTopBar />}

        {/* Main Content Area — Intersepsi sub-rute jika sistem sedang libur / shutdown */}
        <main ref={mainRef} className="flex-1 w-full flex flex-col">
          {isHolidayPause && isDirectUrlSubpage && statusOperasional ? (
            <LiburPauseScreen
              pageTitle={pathname.includes("mengajar") ? "Absensi Mengajar" : "Absensi Kehadiran"}
              subtitle={statusOperasional.judul}
              judul={statusOperasional.judul}
              deskripsi={statusOperasional.deskripsi}
              periode={statusOperasional.periode}
              keterangan={statusOperasional.keterangan}
              backHref="/guru"
            />
          ) : (
            children
          )}
        </main>

        {/* Panel Pengujian Fleksibel */}
        <DevTestingToolbar />
      </div>
    </div>
  );
}


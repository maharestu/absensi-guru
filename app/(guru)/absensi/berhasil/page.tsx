"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Button from "@/components/ui/button";

const STATUS_TITLES: Record<string, string> = {
  hadir: "Absensi Kehadiran",
  izin: "Absensi Izin",
  sakit: "Absensi Sakit",
};

function BerhasilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "hadir";
  const title = STATUS_TITLES[status] ?? "Absensi";

  // Format tanggal & waktu saat ini dalam bahasa Indonesia
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const formattedDateTime = `${dayName}, ${date} ${month} ${year} • ${hours}:${minutes} WIB`;

  const handleSelesai = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("absensi_captured_photo");
      sessionStorage.setItem("absensi_completed", "true");
      sessionStorage.setItem("absensi_status", status);
      sessionStorage.setItem("absensi_time", `${hours}:${minutes} WIB`);
      sessionStorage.setItem("absensi_date", `${dayName}, ${date} ${month} ${year}`);
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">

      {/* Ikon Centang Hijau */}
      <div className="w-12 h-12 bg-[#16a34a] rounded-full flex items-center justify-center shadow-lg mb-5 mt-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Judul */}
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight text-center mb-3">
        {title}<br />Berhasil
      </h1>

      {/* Sub-judul */}
      <p className="text-slate-500 text-sm mb-8 text-center">
        Data absensi Anda sudah tersimpan.
      </p>

      {/* ── BOX INFO: 306x128 ── */}
      <div className="w-[306px] h-[128px] bg-white border border-slate-200 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-700 font-medium">
          {formattedDateTime}
        </p>
        <div className="bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-5 py-1.5 rounded-full tracking-widest">
          TERSIMPAN
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-[40px]" />

      {/* ── TOMBOL SELESAI: 354x54 ── */}
      <div className="w-full max-w-[354px] mt-6">
        <Button onClick={handleSelesai}>
          Selesai
        </Button>
      </div>

    </div>
  );
}

// Suspense wajib karena useSearchParams() butuh Suspense boundary di Next.js
export default function BerhasilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F7]" />}>
      <BerhasilContent />
    </Suspense>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";

export default function AbsensiMengajarBerhasilPage() {
  const router = useRouter();

  // Format tanggal & waktu saat ini dalam bahasa Indonesia
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
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
      sessionStorage.removeItem("absensi_mengajar_photo");
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEF2F7] px-6 pt-30 pb-10">
      {/* Ikon Centang Hijau */}
      <div className="w-12 h-12 bg-[#16a34a] rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13L9 17L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Judul */}
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight text-center mb-3">
        Absensi Mengajar
        <br />
        Berhasil
      </h1>

      {/* Sub-judul */}
      <p className="text-slate-500 text-sm text-center mb-8">
        Data absensi mengajar Anda sudah tersimpan.
      </p>

      {/* ── KARTU BOX INFO: TERSIMPAN (Sesuai Figma) ── */}
      <div className="w-full max-w-[320px] bg-white border border-slate-200 rounded-[20px] shadow-sm p-6 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs sm:text-sm text-slate-700 font-medium">
          {formattedDateTime}
        </p>
        <div className="bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-6 py-1.5 rounded-full tracking-widest">
          TERSIMPAN
        </div>
      </div>

      {/* ── TOMBOL SELESAI ── */}
      <div className="w-full max-w-[354px] mt-30">
        <Button onClick={handleSelesai}>Selesai</Button>
      </div>
    </div>
  );
}

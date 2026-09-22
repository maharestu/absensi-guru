"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";

export default function AbsensiMengajarPage() {
  const router = useRouter();
  const [hasAttended, setHasAttended] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = sessionStorage.getItem("absensi_completed") === "true";
      const status = sessionStorage.getItem("absensi_status");
      // Hanya user yang status absensi kehadirannya "hadir" yang diizinkan
      setHasAttended(completed && status === "hadir");
    }
  }, []);

  if (hasAttended === null) {
    return <div className="min-h-screen bg-[#EEF2F7]" />;
  }

  if (!hasAttended) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
        {/* Header Navigation */}
        <PageHeader
          backHref="/dashboard"
          title="Absensi Mengajar Gagal"
          subtitle="Absensi mengajar hanya bisa dilakukan setelah menyelesaikan absensi kehadiran."
        />

        {/* Kartu Peringatan Gagal */}
        <div className="-mt-2 w-[354px] h-[230px] bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center shadow-md shadow-red-200">
            <span className="text-white font-bold text-2xl leading-none">!</span>
          </div>
          <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
            Anda Belum Melakukan<br />Absensi Kehadiran
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pastikan Anda sudah menyelesaikan absensi kehadiran.
          </p>
        </div>

        {/* Tombol Kembali */}
        <div className="mt-[42px] w-[354px]">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/dashboard"
        title="Absensi Mengajar"
        subtitle="Halaman Absensi Mengajar."
      />
    </div>
  );
}

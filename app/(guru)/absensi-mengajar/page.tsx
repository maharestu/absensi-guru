"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { MOCK_TINGKATAN_KELAS } from "@/lib/mock-data";

export default function AbsensiMengajarPage() {
  const router = useRouter();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = sessionStorage.getItem("absensi_completed") === "true";
      const status = sessionStorage.getItem("absensi_status");

      // Absensi Mengajar HANYA bisa diakses jika user sudah absen HADIR hari ini
      if (completed && status === "hadir") {
        setCanAccess(true);
      } else {
        setCanAccess(false);
      }
    }
  }, []);

  const handleSelectTingkat = (tingkatId: string) => {
    router.push(`/absensi-mengajar/${tingkatId}`);
  };

  // Loading placeholder untuk mencegah flash
  if (canAccess === null) {
    return <div className="min-h-screen bg-[#EEF2F7]" />;
  }

  // ── TAMPILAN GAGAL / BELUM ABSEN HADIR (Sesuai Desain Figma) ──
  if (!canAccess) {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
        <PageHeader
          backHref="/dashboard"
          title="Absensi Mengajar Gagal"
          subtitle="Absensi mengajar hanya bisa dilakukan setelah menyelesaikan absensi kehadiran."
        />

        {/* Card Peringatan */}
        <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
          {/* Red Circle exclamation */}
          <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-red-200">
            <span className="font-bold text-2xl leading-none">!</span>
          </div>

          <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
            Anda Belum Melakukan<br />Absensi Kehadiran
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed">
            Pastikan Anda sudah menyelesaikan absensi kehadiran.
          </p>
        </div>

        {/* Tombol Kembali */}
        <div className="w-full mt-10">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  // ── TAMPILAN NORMAL: Pilihan Tingkatan Kelas ──
  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/dashboard"
        title="Absensi Mengajar"
        subtitle="Pilih kelas yang akan diajar hari ini."
      />

      {/* Section Header */}
      <h2 className="text-sm font-bold text-slate-900 -mt-6 mb-6">Daftar Kelas</h2>

      {/* List Tingkatan Kelas */}
      <div className="flex flex-col gap-10">
        {MOCK_TINGKATAN_KELAS.map((tingkat) => (
          <button
            key={tingkat.id}
            onClick={() => handleSelectTingkat(tingkat.id)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
          >
            <span className="text-base font-bold text-slate-900">
              {tingkat.label}
            </span>
            <div className="flex-shrink-0 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

export default function LokasiPage() {
  const router = useRouter();
  const [scanState, setScanState] = useState<ScanState>("IDLE");

  const handleScan = () => {
    setScanState("SCANNING");
    setTimeout(() => {
      const isSuccess = Math.random() > 0.5;
      setScanState(isSuccess ? "SUCCESS" : "FAIL");
    }, 1500);
  };

  const handleRetake = () => {
    setScanState("IDLE");
  };

  const handleContinue = () => {
    router.push("/guru/presensi/verifikasi?status=hadir");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      {scanState === "IDLE" || scanState === "SCANNING" ? (
        <PageHeader
          backHref="/guru/presensi/hadir"
          title="Cek Lokasi"
          subtitle="Pastikan lokasi Anda saat ini berada di sekitar area sekolah."
        />
      ) : scanState === "SUCCESS" ? (
        <PageHeader
          backHref="/guru/presensi/hadir"
          title="Lokasi Sesuai"
          subtitle="Lokasi Anda sudah berada di area sekitar sekolah."
        />
      ) : (
        <PageHeader
          backHref="/guru/presensi/hadir"
          title="Lokasi Tidak Sesuai"
          subtitle="Absensi hadir hanya dapat dilakukan di area sekolah."
        />
      )}

      {(scanState === "IDLE" || scanState === "SCANNING") && (
        <>
          <div className="w-full bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center justify-center py-8">
            <div className="w-full mx-4 bg-[#eaf5f0] border border-[#d1e8de] rounded-[16px] flex flex-col items-center justify-center gap-4 py-10">
              {scanState === "SCANNING" ? (
                <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <div className="text-blue-600">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="12" y1="2" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="12" y1="14.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="2" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="14.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <h2 className="text-base font-bold text-slate-900">Area Sekolah</h2>
              <div className="bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-4 py-1 rounded-full tracking-widest">
                GPS AKTIF
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Button
              onClick={handleScan}
              disabled={scanState === "SCANNING"}
            >
              {scanState === "SCANNING" ? "Memindai..." : "Scan Lokasi"}
            </Button>
          </div>
        </>
      )}

      {scanState === "SUCCESS" && (
        <>
          <div className="w-full bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
            <div className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center shadow-md shadow-green-200">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
              Anda Sudah Berada Di<br />Area Sekolah
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
              Lokasi berhasil diverifikasi dan berada di dalam jangkauan area absensi sekolah.
            </p>
          </div>

          <div className="mt-10">
            <Button onClick={handleContinue}>
              Lanjutkan
            </Button>
          </div>
        </>
      )}

      {scanState === "FAIL" && (
        <>
          <div className="w-full bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
            <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center shadow-md shadow-red-200">
              <span className="text-white font-bold text-2xl leading-none">!</span>
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
              Anda Berada Di Luar<br />Area Sekolah
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
              Pastikan Anda berada di area sekitar sekolah.
            </p>
          </div>

          <div className="mt-10">
            <Button onClick={handleRetake}>
              Scan Ulang Lokasi
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

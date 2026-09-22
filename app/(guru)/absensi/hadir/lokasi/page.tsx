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
    // Simulasi loading 1.5 detik, lalu acak 50:50
    setTimeout(() => {
      const isSuccess = Math.random() > 0.5;
      setScanState(isSuccess ? "SUCCESS" : "FAIL");
    }, 1500);
  };

  const handleRetake = () => {
    setScanState("IDLE");
  };

  const handleContinue = () => {
    router.push("/absensi/verifikasi?status=hadir");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">

      {/* ── HEADER ── */}
      {scanState === "IDLE" || scanState === "SCANNING" ? (
        <PageHeader
          backHref="/absensi/hadir"
          title="Cek Lokasi"
          subtitle="Pastikan lokasi Anda saat ini berada di sekitar area sekolah."
        />
      ) : scanState === "SUCCESS" ? (
        <PageHeader
          backHref="/absensi/hadir"
          title="Lokasi Sesuai"
          subtitle="Lokasi Anda sudah berada di area sekitar sekolah."
        />
      ) : (
        <PageHeader
          backHref="/absensi/hadir"
          title="Lokasi Tidak Sesuai"
          subtitle="Absensi hadir hanya dapat dilakukan di area sekolah."
        />
      )}

      {/* ── KARTU IDLE / SCANNING ── */}
      {(scanState === "IDLE" || scanState === "SCANNING") && (
        <>
          {/* OUTER white card: 354x270, border-radius 20px, border 1px */}
          <div className="-mt-2 w-[354px] h-[270px] bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center justify-center">
            {/* INNER green card */}
            <div className="w-[310px] h-[220px] bg-[#eaf5f0] border border-[#d1e8de] rounded-[16px] flex flex-col items-center justify-center gap-4">
              {scanState === "SCANNING" ? (
                <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <div className="text-blue-600">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <h2 className="text-base font-bold text-slate-900">Area Sekolah</h2>
              <div className="bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-4 py-1 rounded-full tracking-widest">
                GPS AKTIF
              </div>
            </div>
          </div>

          {/* Tombol Scan Lokasi: 354x54, jarak 42px dari bawah box */}
          <div className="mt-[42px] w-[354px]">
            <Button
              onClick={handleScan}
              disabled={scanState === "SCANNING"}
            >
              {scanState === "SCANNING" ? "Memindai..." : "Scan Lokasi"}
            </Button>
          </div>
        </>
      )}

      {/* ── KARTU SUCCESS ── */}
      {scanState === "SUCCESS" && (
        <>
          <div className="-mt-2 w-[354px] h-[230px] bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center shadow-md shadow-green-200">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
              Anda Sudah Berada Di<br />Area Sekolah
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lokasi berhasil diverifikasi dan berada di dalam jangkauan area absensi sekolah.
            </p>
          </div>

          <div className="mt-[42px] w-[354px]">
            <Button onClick={handleContinue}>
              Lanjutkan
            </Button>
          </div>
        </>
      )}

      {/* ── KARTU FAIL ── */}
      {scanState === "FAIL" && (
        <>
          <div className="-mt-2 w-[354px] h-[230px] bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center shadow-md shadow-red-200">
              <span className="text-white font-bold text-2xl leading-none">!</span>
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
              Anda Berada Di Luar<br />Area Sekolah
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pastikan Anda berada di area sekitar sekolah.
            </p>
          </div>

          <div className="mt-[42px] w-[354px]">
            <Button variant="outline" onClick={handleRetake}>
              Scan Ulang Lokasi
            </Button>
          </div>
        </>
      )}

    </div>
  );
}

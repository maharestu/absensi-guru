"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { isWithinGeofence } from "@/lib/geo";
import { useEffect } from "react";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

export default function LokasiPage() {
  const router = useRouter();
  const [scanState, setScanState] = useState<ScanState>("IDLE");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [sekolahLat, setSekolahLat] = useState<number>(-6.175392);
  const [sekolahLng, setSekolahLng] = useState<number>(106.827153);
  const [radiusToleransi, setRadiusToleransi] = useState<number>(50);

  useEffect(() => {
    async function loadConfig() {
      try {
        const { getLokasiSekolah } = await import("@/actions/pengaturan");
        const config = await getLokasiSekolah();
        setSekolahLat(config.latitude);
        setSekolahLng(config.longitude);
        setRadiusToleransi(config.radius_meter);
      } catch (err) {
        console.error("Gagal memuat pengaturan lokasi:", err);
      }
    }
    loadConfig();
  }, []);

  const handleScan = () => {
    setScanState("SCANNING");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("Geolokasi tidak didukung oleh browser Anda.");
      setScanState("FAIL");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const isSuccess = isWithinGeofence(userLat, userLng, sekolahLat, sekolahLng, radiusToleransi);

        if (isSuccess) {
          // Simpan koordinat asli guru untuk dikirim ke database nanti
          sessionStorage.setItem("absensi_lat", userLat.toString());
          sessionStorage.setItem("absensi_lng", userLng.toString());
          setScanState("SUCCESS");
        } else {
          setErrorMsg("Pastikan anda berada di area sekitar sekolah.");
          setScanState("FAIL");
        }
      },
      (error) => {
        console.error("Gagal mendapatkan lokasi GPS:", error);
        setErrorMsg("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan browser mengakses lokasi.");
        setScanState("FAIL");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleRetake = () => {
    setScanState("IDLE");
  };

  const handleContinue = () => {
    router.push("/guru/presensi/verifikasi?status=hadir");
  };

  const handleBypass = () => {
    sessionStorage.setItem("absensi_lat", sekolahLat.toString());
    sessionStorage.setItem("absensi_lng", sekolahLng.toString());
    setScanState("SUCCESS");
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
              {errorMsg || "Pastikan Anda berada di area sekitar sekolah."}
            </p>
          </div>

          <div className="mt-10">
            <Button onClick={handleRetake}>
              Pindai Ulang Lokasi
            </Button>
          </div>
        </>
      )}

      {/* Tombol Bypass untuk Development */}
      {scanState !== "SUCCESS" && (
        <div className="mt-auto pt-10 pb-4">
          <button
            onClick={handleBypass}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-300 text-sm font-bold text-orange-500 hover:bg-orange-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Bypass Verifikasi (Dev Only)
          </button>
        </div>
      )}
    </div>
  );
}

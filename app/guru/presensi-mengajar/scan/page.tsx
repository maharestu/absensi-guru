"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

function ScanQrKelasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>("IDLE");

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
        setHasPermission(false);
      }
    };

    if (scanState === "IDLE" || scanState === "SCANNING") {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanState]);

  const handleScan = () => {
    setScanState("SCANNING");
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      setScanState(isSuccess ? "SUCCESS" : "FAIL");
    }, 1200);
  };

  const handleRetake = () => {
    setScanState("IDLE");
  };

  const handleContinue = () => {
    const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
    router.push(`/guru/presensi-mengajar/foto?jadwal_id=${jadwalId}${hariQuery}`);
  };

  const backHref = hari
    ? `/guru/presensi-mengajar/${encodeURIComponent(hari)}`
    : `/guru/presensi-mengajar`;

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      {scanState === "IDLE" || scanState === "SCANNING" ? (
        <PageHeader
          backHref={backHref}
          title="Scan QR Kelas"
          subtitle="Arahkan kamera ke QR code kelas."
        />
      ) : scanState === "SUCCESS" ? (
        <PageHeader
          backHref={backHref}
          title="Scan QR Kelas"
          subtitle="QR code sudah valid"
        />
      ) : (
        <PageHeader
          backHref={backHref}
          title="Scan QR Kelas"
          subtitle="QR code tidak dapat diverifikasi."
        />
      )}

      {(scanState === "IDLE" || scanState === "SCANNING") && (
        <>
          <div className="relative w-full h-[450px] bg-[#0c1322] rounded-[28px] overflow-hidden shadow-lg flex items-center justify-center p-8 border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${hasPermission ? "opacity-70" : "hidden"}`}
            />

            {!hasPermission && hasPermission !== null && (
              <p className="text-white text-sm text-center relative z-10">
                Akses kamera ditolak atau tidak tersedia.
              </p>
            )}

            {hasPermission && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-[3px] border-white/50 rounded-3xl relative">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-3xl"></div>
                </div>
              </div>
            )}

            {scanState === "SCANNING" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 px-4">
            Posisikan QR Code kelas di dalam area kotak untuk melakukan verifikasi.
          </p>

          <div className="w-full mt-auto pt-8">
            <Button
              onClick={handleScan}
              disabled={scanState === "SCANNING" || !hasPermission}
            >
              {scanState === "SCANNING" ? "Memverifikasi..." : "Verifikasi QR"}
            </Button>
          </div>
        </>
      )}

      {scanState === "SUCCESS" && (
        <div className="flex-1 flex flex-col justify-center items-center text-center -mt-20">
          <div className="w-24 h-24 bg-[#10b981] rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-200 animate-in zoom-in duration-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-slate-900 mb-3">
            QR Code Valid!
          </h2>
          <p className="text-sm text-slate-500 mb-10 px-4 leading-relaxed">
            Sistem telah berhasil memverifikasi QR Code ruangan. Silakan lanjutkan ke tahap berikutnya.
          </p>
          <div className="w-full mt-auto">
            <Button onClick={handleContinue}>Lanjutkan</Button>
          </div>
        </div>
      )}

      {scanState === "FAIL" && (
        <div className="flex-1 flex flex-col justify-center items-center text-center -mt-20">
          <div className="w-24 h-24 bg-[#ef4444] rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-red-200 animate-in zoom-in duration-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-slate-900 mb-3">
            Verifikasi Gagal
          </h2>
          <p className="text-sm text-slate-500 mb-10 px-4 leading-relaxed">
            QR Code tidak dikenali atau tidak cocok dengan ruangan kelas jadwal ini. Pastikan Anda scan di kelas yang benar.
          </p>
          <div className="w-full mt-auto flex flex-col gap-3">
            <Button onClick={handleRetake}>Coba Lagi</Button>
            <Button variant="outline" onClick={() => router.push(backHref)}>
              Kembali ke Jadwal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanQrKelasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F7]" />}>
      <ScanQrKelasContent />
    </Suspense>
  );
}

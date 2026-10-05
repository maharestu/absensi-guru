"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import jsQR from "jsqr";
import { verifyQrKelas } from "@/actions/presensi";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

function ScanQrKelasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>("IDLE");

  // Fungsi untuk memproses frame video secara berulang (continuous scan)
  const tick = () => {
    if (scanState !== "IDLE" && scanState !== "SCANNING") return;
    
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && jadwalId) {
          // Jika QR Code ditemukan!
          processQRCode(code.data);
          return; // Hentikan loop sementara proses verifikasi berjalan
        }
      }
    }
    
    // Ulangi frame berikutnya
    requestRef.current = requestAnimationFrame(tick);
  };

  const processQRCode = async (scannedText: string) => {
    if (!jadwalId) return;
    setScanState("SCANNING");
    
    try {
      // Panggil backend untuk memverifikasi QR
      const isSuccess = await verifyQrKelas(jadwalId, scannedText);
      setScanState(isSuccess ? "SUCCESS" : "FAIL");
    } catch (err) {
      console.error(err);
      setScanState("FAIL");
    }
  };

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
        
        // Mulai loop scanning begitu kamera menyala
        requestRef.current = requestAnimationFrame(tick);
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
        setHasPermission(false);
      }
    };

    if (scanState === "IDLE") {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [scanState]);

  // Tombol bypass untuk keperluan testing (mock success)
  const handleBypass = () => {
    setScanState("SCANNING");
    setTimeout(() => {
      setScanState("SUCCESS");
    }, 1000);
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
          subtitle="Arahkan kamera ke QR code kelas yang dipilih."
        />
      ) : scanState === "SUCCESS" ? (
        <PageHeader
          backHref={backHref}
          title="Scan QR Kelas"
          subtitle="QR code sudah valid"
        />
      ) : (
        <PageHeader
          backHref={undefined}
          title="Scan QR Kelas"
          subtitle="QR code tidak dapat diverifikasi."
        />
      )}

      {(scanState === "IDLE" || scanState === "SCANNING") && (
        <>
          <div className="relative w-full h-[520px] bg-[#0f172a] rounded-[24px] overflow-hidden shadow-lg flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${hasPermission ? "opacity-60" : "hidden"}`}
            />
            {/* Hidden canvas for processing frames */}
            <canvas ref={canvasRef} className="hidden" />

            {!hasPermission && hasPermission !== null && (
              <p className="text-white text-sm text-center relative z-10">
                Akses kamera ditolak atau tidak tersedia.
              </p>
            )}

            {hasPermission && (
              <div className="absolute inset-0 z-10 pointer-events-none p-10 flex items-center justify-center">
                <span className="text-white text-[13px] font-bold tracking-widest absolute">
                  AREA QR CODE
                </span>
                
                {/* Frame sudut */}
                <div className="absolute top-12 left-10 w-10 h-10 border-t-[3px] border-l-[3px] border-white"></div>
                <div className="absolute top-12 right-10 w-10 h-10 border-t-[3px] border-r-[3px] border-white"></div>
                <div className="absolute bottom-12 left-10 w-10 h-10 border-b-[3px] border-l-[3px] border-white"></div>
                <div className="absolute bottom-12 right-10 w-10 h-10 border-b-[3px] border-r-[3px] border-white"></div>
              </div>
            )}

            {scanState === "SCANNING" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="w-full mt-auto pt-8 flex flex-col gap-3">
            <Button
              onClick={handleBypass}
              variant="outline"
              disabled={scanState === "SCANNING"}
              className="border-slate-300 text-slate-500 hover:bg-slate-50"
            >
              Bypass Verifikasi (Testing)
            </Button>
          </div>
        </>
      )}

      {scanState === "SUCCESS" && (
        <div className="flex flex-col h-full mt-6">
          <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-300">
            <div className="w-14 h-14 bg-[#10b981] rounded-full flex items-center justify-center text-white mb-6 shadow-md shadow-emerald-200">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-3 px-4">
              QR Code Kelas Sudah Valid
            </h2>
            <p className="text-sm text-slate-500">
              QR Code berhasil diverifikasi.
            </p>
          </div>
          <div className="w-full mt-10">
            <Button onClick={handleContinue}>Lanjutkan</Button>
          </div>
        </div>
      )}

      {scanState === "FAIL" && (
        <div className="flex flex-col h-full mt-6">
          <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-300">
            <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center text-white mb-6 shadow-md shadow-red-200">
              <span className="font-bold text-2xl leading-none">!</span>
            </div>
            <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-3 px-2">
              Qr Code Kelas Tidak Valid
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed px-2">
              QR tidak sesuai dengan kelas yang dipilih atau sudah tidak berlaku.
            </p>
          </div>
          <div className="w-full mt-10">
            <Button variant="outline" onClick={handleRetake} className="border-slate-200 text-slate-900 font-bold hover:bg-slate-50">
              Pindai Ulang QR
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

"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import jsQR from "jsqr";
import { verifyQrKelas } from "@/actions/presensi";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

function extractKodeFromQr(urlOrText: string): string | null {
  try {
    const url = new URL(urlOrText);
    const parts = url.pathname.split("/");
    if (parts.length >= 3 && parts[1] === "absen-qr") {
      return parts[2];
    }
  } catch (e) {
    // Fallback: bukan URL valid, anggap itu kodenya jika tidak mengandung slash
    if (!urlOrText.includes("/")) return urlOrText;
  }
  return null;
}

function ScanQrKelasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>("IDLE");
  const scanStateRef = useRef<ScanState>(scanState);

  useEffect(() => {
    scanStateRef.current = scanState;
  }, [scanState]);

  // Fungsi untuk memproses frame video secara berulang (continuous scan)
  const tick = () => {
    if (scanStateRef.current !== "IDLE" && scanStateRef.current !== "SCANNING") return;
    
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
    
    const kodeQr = extractKodeFromQr(scannedText);
    if (!kodeQr) {
      setScanState("FAIL");
      return;
    }

    if (!navigator.geolocation) {
      setScanState("FAIL");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const isSuccess = await verifyQrKelas(jadwalId, kodeQr, lat, lng);
          setScanState(isSuccess ? "SUCCESS" : "FAIL");
        } catch (err) {
          console.error(err);
          setScanState("FAIL");
        }
      },
      (err) => {
        console.error("GPS error", err);
        setScanState("FAIL");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = 0;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMsg("");
    setHasPermission(null);

    // Beri sedikit jeda agar hardware kamera sebelumnya (misal dari selfie kehadiran) benar-benar terlepas
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!isMountedRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      
      // Mulai loop scanning begitu kamera menyala
      requestRef.current = requestAnimationFrame(tick);
    } catch (err: unknown) {
      console.error("Gagal mengakses kamera:", err);
      if (!isMountedRef.current) return;
      setHasPermission(false);
      const isDenied = (err as Error)?.name === "NotAllowedError" || (err as Error)?.name === "PermissionDeniedError";
      setErrorMsg(
        isDenied
          ? "Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser."
          : "Gagal mengakses kamera. Kamera mungkin sedang digunakan atau belum siap. Silakan coba lagi."
      );
    }
  }, [stopStream]);

  useEffect(() => {
    isMountedRef.current = true;

    if (scanState === "IDLE") {
      startCamera();
    } else if (scanState === "SUCCESS" || scanState === "FAIL") {
      stopStream();
    }

    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, [scanState, startCamera, stopStream]);

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
    <div className="flex flex-col min-h-full bg-[#EEF2F7] px-6 pt-3 pb-14">
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
          <div className="relative w-full aspect-[3/4] max-h-[60vh] min-h-[350px] bg-[#0f172a] rounded-[24px] overflow-hidden shadow-lg flex items-center justify-center border border-slate-800">
            {/* Loading State */}
            {hasPermission === null && (
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/70 text-sm font-medium">Meminta akses kamera...</p>
              </div>
            )}

            {/* Error State */}
            {hasPermission === false && (
              <div className="flex flex-col items-center justify-center px-6 text-center z-10">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </div>
                <p className="text-white font-semibold text-sm">Kamera Wajib Diaktifkan</p>
                <p className="text-white/70 text-xs mt-1.5 max-w-[260px] leading-relaxed">
                  {errorMsg || "Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada browser Anda."}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all touch-manipulation cursor-pointer"
                >
                  Coba Lagi Akses Kamera
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${hasPermission ? "opacity-60" : "hidden"}`}
            />
            {/* Hidden canvas for processing frames */}
            <canvas ref={canvasRef} className="hidden" />

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

          <div className="w-full mt-auto pt-6 text-center">
            <p className="text-xs text-slate-400">
              Posisikan QR code kelas di dalam kotak pemindai
            </p>
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
    <Suspense fallback={<div className="min-h-full bg-[#EEF2F7]" />}>
      <ScanQrKelasContent />
    </Suspense>
  );
}

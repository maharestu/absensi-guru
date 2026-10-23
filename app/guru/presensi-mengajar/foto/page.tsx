"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";

function FotoSelfieKelasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [photo, setPhoto] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMsg("");
    setHasPermission(null);

    // Beri sedikit jeda agar hardware kamera sebelumnya (misal dari scan QR atau kehadiran) benar-benar terlepas
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!isMountedRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
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

    if (!photo) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, [photo, startCamera, stopStream]);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        setPhoto(dataUrl);
      }
    }
  };


  const handleRetake = () => {
    setPhoto(null);
  };

  const handleContinue = () => {
    if (!photo) return;
    sessionStorage.setItem("absensi_mengajar_photo", photo);
    const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
    router.push(`/guru/presensi-mengajar/verifikasi?jadwal_id=${jadwalId}${hariQuery}`);
  };

  const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] px-6 pt-3 pb-14">
      <PageHeader
        backHref={`/guru/presensi-mengajar/scan?jadwal_id=${jadwalId}${hariQuery}`}
        title="Ambil Foto Mengajar"
        subtitle="Pastikan wajah Anda terlihat jelas dan pencahayaan cukup."
      />

      {!photo ? (
        <>
          <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-slate-800 rounded-[28px] overflow-hidden shadow-sm border border-slate-200 flex flex-col items-center justify-center">
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
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${hasPermission ? "opacity-100" : "hidden"}`}
            />
          </div>

          {/* Tombol Capture Lingkaran (Sama persis seperti Absensi Kehadiran) */}
          <div className="w-full mt-auto pt-6 flex justify-center items-center">
            <button
              type="button"
              onClick={handleTakePhoto}
              disabled={hasPermission !== true}
              className={`relative w-20 h-20 rounded-full border-[3px] flex items-center justify-center bg-transparent active:scale-95 transition-all touch-manipulation ${
                hasPermission === true
                  ? "border-slate-300 cursor-pointer"
                  : "border-slate-200 opacity-40 cursor-not-allowed"
              }`}
              aria-label="Ambil foto"
            >
              {/* Inner circle biru */}
              <div
                className={`w-[60px] h-[60px] rounded-full transition-all ${
                  hasPermission === true
                    ? "bg-blue-600 shadow-md shadow-blue-600/30"
                    : "bg-slate-400"
                }`}
              />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-slate-200 rounded-[28px] overflow-hidden shadow-sm border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Hasil Selfie"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="w-full mt-auto pt-6 flex flex-col gap-3">
            <Button onClick={handleContinue}>
              Lanjutkan
            </Button>
            <Button variant="outline" onClick={handleRetake}>
              Ulangi
            </Button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function FotoSelfieKelasPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-[#EEF2F7]" />}>
      <FotoSelfieKelasContent />
    </Suspense>
  );
}

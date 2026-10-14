"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";

function FotoSelfieKelasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
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

    if (!photo) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [photo]);

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

  const handleBypass = () => {
    // 1x1 transparent png
    const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    setPhoto(dummyImage);
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  const handleContinue = () => {
    if (photo) {
      sessionStorage.setItem("absensi_mengajar_photo", photo);
    }
    const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
    router.push(`/guru/presensi-mengajar/verifikasi?jadwal_id=${jadwalId}${hariQuery}`);
  };

  const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] px-6 pt-3 pb-10">
      <PageHeader
        backHref={`/guru/presensi-mengajar/scan?jadwal_id=${jadwalId}${hariQuery}`}
        title="Ambil Foto Mengajar"
        subtitle="Pastikan wajah Anda terlihat jelas dan pencahayaan cukup."
      />

      {!photo ? (
        <>
          <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-slate-800 rounded-[28px] overflow-hidden shadow-sm border border-slate-200">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${hasPermission ? "opacity-100" : "hidden"}`}
            />

            {!hasPermission && hasPermission !== null && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <p className="text-white text-sm text-center relative z-10">
                  Akses kamera ditolak atau tidak tersedia.
                </p>
              </div>
            )}
          </div>

          <div className="w-full mt-auto pt-8 flex flex-col gap-4">
            <button
              onClick={handleBypass}
              className="text-[13px] text-slate-400 hover:text-slate-600 mx-auto underline transition-colors"
            >
              Bypass (Testing)
            </button>
            <button
              onClick={handleTakePhoto}
              disabled={!hasPermission}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-sm transition-all"
            >
              Ambil Foto
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

          <div className="w-full mt-auto pt-8 flex flex-col gap-4">
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-sm transition-all"
            >
              Lanjutkan
            </button>
            <button
              onClick={handleRetake}
              className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-2xl font-bold shadow-sm transition-all"
            >
              Ulangi
            </button>
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

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhoto(dataUrl);
      }
    }
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
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref={`/guru/presensi-mengajar/scan?jadwal_id=${jadwalId}${hariQuery}`}
        title="Foto Selfie"
        subtitle="Ambil foto selfie di dalam ruangan kelas."
      />

      {!photo ? (
        <>
          <div className="relative w-full h-[450px] bg-[#0c1322] rounded-[28px] overflow-hidden shadow-lg flex items-center justify-center p-8 border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${hasPermission ? "opacity-100" : "hidden"}`}
            />

            {!hasPermission && hasPermission !== null && (
              <p className="text-white text-sm text-center relative z-10">
                Akses kamera ditolak atau tidak tersedia.
              </p>
            )}

            {hasPermission && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-40">
                <svg width="200" height="280" viewBox="0 0 200 280" fill="none">
                  <ellipse cx="100" cy="140" rx="85" ry="120" stroke="white" strokeWidth="3" strokeDasharray="10 10" />
                </svg>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 px-4">
            Pastikan wajah Anda dan suasana kelas terlihat dengan jelas.
          </p>

          <div className="w-full mt-auto pt-8">
            <Button
              onClick={handleTakePhoto}
              disabled={!hasPermission}
            >
              Ambil Foto
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="relative w-full h-[450px] bg-slate-200 rounded-[28px] overflow-hidden shadow-lg border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Hasil Selfie"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 px-4">
            Apakah foto ini sudah terlihat jelas dan menampilkan suasana kelas?
          </p>

          <div className="w-full mt-auto pt-8 flex flex-col gap-3">
            <Button onClick={handleContinue}>Gunakan Foto Ini</Button>
            <Button variant="outline" onClick={handleRetake}>
              Foto Ulang
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
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F7]" />}>
      <FotoSelfieKelasContent />
    </Suspense>
  );
}

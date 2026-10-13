"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Gunakan kamera depan
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      setHasPermission(false);
      setErrorMsg(
        "Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses kamera pada browser untuk mengambil foto presensi."
      );
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();

    // Cleanup saat komponen dibongkar (unmount)
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const handleCapture = () => {
    // Larang capture jika tidak ada izin kamera
    if (hasPermission !== true || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Menentukan ukuran maksimal gambar (resize)
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }

    // Set ukuran canvas sesuai dengan ukuran resize
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (context) {
      // Balik horizontal (Mirror) agar hasil foto sesuai dengan layar preview
      context.translate(width, 0);
      context.scale(-1, 1);

      // Gambar frame dari video ke canvas
      context.drawImage(video, 0, 0, width, height);
      // Ambil data gambar (base64) dengan format WebP dan kualitas 70%
      const imageSrc = canvas.toDataURL("image/webp", 0.7);
      onCapture(imageSrc);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Area Kamera */}
      <div className="relative w-full h-[430px] bg-slate-900 rounded-[24px] overflow-hidden shadow-lg flex flex-col items-center justify-center">
        {hasPermission === null && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/70 text-sm font-medium">Meminta akses kamera...</p>
          </div>
        )}

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
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Elemen Video (Di-mirror menggunakan -scale-x-100) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${hasPermission ? "block" : "hidden"}`}
        />

        {/* Elemen Canvas (Tersembunyi, hanya untuk proses capture) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Tombol Capture */}
      <div className="mt-6 mb-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={hasPermission !== true}
          className={`relative w-20 h-20 rounded-full border-[3px] flex items-center justify-center bg-transparent active:scale-95 transition-all
            ${hasPermission === true ? "border-slate-300 cursor-pointer" : "border-slate-200 opacity-40 cursor-not-allowed"}
          `}
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
    </div>
  );
}


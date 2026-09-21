"use client";

import React, { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, // Gunakan kamera depan
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
        setHasPermission(false);
        setErrorMsg("Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera pada browser.");
      }
    };

    startCamera();

    // Cleanup saat komponen dibongkar (unmount)
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    // Mode Simulasi jika kamera tidak tersedia / izin tidak diberikan
    if (hasPermission === false) {
      // Gambar simulasi guru dari Unsplash
      onCapture(
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
      );
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set ukuran canvas sesuai dengan ukuran video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        // Gambar frame dari video ke canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Ambil data gambar (base64)
        const imageSrc = canvas.toDataURL("image/jpeg");
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Area Kamera */}
      <div className="relative w-full h-[430px] bg-slate-900 rounded-[24px] overflow-hidden shadow-lg flex flex-col items-center justify-center">
        {hasPermission === null && (
          <p className="text-white/70 text-sm font-medium">Meminta akses kamera...</p>
        )}

        {hasPermission === false && (
          <div className="flex flex-col items-center justify-center px-6 text-center">
            <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
            <p className="text-white/60 text-xs mt-3 bg-white/10 px-3 py-1.5 rounded-full">
              Mode Simulasi (Klik tombol biru untuk lanjut)
            </p>
          </div>
        )}

        {/* Elemen Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${hasPermission ? "block" : "hidden"}`}
        />

        {/* Elemen Canvas (Tersembunyi, hanya untuk proses capture) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Tombol Capture */}
      <div className="mt-6 mb-2">
        <button
          onClick={handleCapture}
          disabled={hasPermission === null}
          className="relative w-20 h-20 rounded-full border-[3px] border-slate-200 flex items-center justify-center bg-transparent active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Ambil foto"
        >
          {/* Inner circle biru */}
          <div className="w-[60px] h-[60px] rounded-full bg-blue-600 shadow-md shadow-blue-600/30"></div>
        </button>
      </div>
    </div>
  );
}

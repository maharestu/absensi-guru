"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import CameraCapture from "@/components/absensi/camera-capture";
import Button from "@/components/ui/button";

const PHOTO_STORAGE_KEY = "absensi_captured_photo";

export default function HadirPage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Ambil foto tersimpan jika user kembali dari halaman lokasi
  useEffect(() => {
    const saved = sessionStorage.getItem(PHOTO_STORAGE_KEY);
    if (saved) {
      setCapturedImage(saved);
    }
  }, []);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    sessionStorage.setItem(PHOTO_STORAGE_KEY, imageSrc);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
  };

  const handleContinue = () => {
    // Navigate to location scanning page
    router.push("/absensi/hadir/lokasi");
  };

  const handleBack = () => {
    if (capturedImage) {
      // Kembali ke mode ambil gambar (kamera)
      handleRetake();
    } else {
      // Kembali ke halaman pemilihan status absensi
      sessionStorage.removeItem(PHOTO_STORAGE_KEY);
      router.push("/pilih-status");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">

      <PageHeader
        onBack={handleBack}
        title={capturedImage ? "Ambil Foto Absensi" : "Ambil Foto Kehadiran"}
        subtitle="Pastikan wajah Anda terlihat jelas dan pencahayaan cukup."
      />

      {/* Konten Utama (Kembali ke ukuran fix aspect ratio) */}
      <div className="-mt-2 flex flex-col items-center w-full">
        {!capturedImage ? (
          <div className="w-full max-w-[354px]">
            <CameraCapture onCapture={handleCapture} />
          </div>
        ) : (
          <div className="w-full max-w-[354px] flex flex-col">
            {/* Preview Foto */}
            <div className="w-full h-[430px] relative bg-slate-200 rounded-[24px] overflow-hidden shadow-sm border border-slate-200/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Preview wajah"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col gap-3 mt-6 flex-shrink-0">
              <Button onClick={handleContinue}>
                Lanjutkan
              </Button>

              <Button variant="outline" onClick={handleRetake}>
                Ulangi
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

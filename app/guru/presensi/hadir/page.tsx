"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import CameraCapture from "@/components/absensi/camera-capture";
import Button from "@/components/ui/button";

const PHOTO_STORAGE_KEY = "absensi_captured_photo";
const PHOTO_STATUS_KEY = "absensi_photo_status";

export default function HadirPage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    const photoStatus = sessionStorage.getItem(PHOTO_STATUS_KEY);
    const saved = sessionStorage.getItem(PHOTO_STORAGE_KEY);

    // HANYA restore jika foto tersebut benar-benar berasal dari selfie hadir
    if (saved && photoStatus === "hadir") {
      setCapturedImage(saved);
    } else {
      // Jika dari status lain (izin/sakit/dinas) atau belum ada, bersihkan agar kamera aktif segar
      sessionStorage.removeItem(PHOTO_STORAGE_KEY);
      sessionStorage.removeItem(PHOTO_STATUS_KEY);
      setCapturedImage(null);
    }
  }, []);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    sessionStorage.setItem(PHOTO_STORAGE_KEY, imageSrc);
    sessionStorage.setItem(PHOTO_STATUS_KEY, "hadir");
  };

  const handleRetake = () => {
    setCapturedImage(null);
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
    sessionStorage.removeItem(PHOTO_STATUS_KEY);
  };

  const handleContinue = () => {
    router.push("/guru/presensi/hadir/lokasi");
  };

  const handleBack = () => {
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
    sessionStorage.removeItem(PHOTO_STATUS_KEY);
    setCapturedImage(null);
    router.push("/guru/pilih-status");
  };

  return (
    <div className="flex flex-col min-h-full bg-[#EEF2F7] px-6 pt-3 pb-10">
      <PageHeader
        onBack={handleBack}
        title={capturedImage ? "Ambil Foto Absensi" : "Ambil Foto Kehadiran"}
        subtitle="Pastikan wajah Anda terlihat jelas dan pencahayaan cukup."
      />

      <div className="-mt-2 flex flex-col items-center w-full">
        {!capturedImage ? (
          <div className="w-full max-w-[354px]">
            <CameraCapture onCapture={handleCapture} />
          </div>
        ) : (
          <div className="w-full max-w-[354px] flex flex-col">
            <div className="w-full h-[430px] relative bg-slate-200 rounded-[24px] overflow-hidden shadow-sm border border-slate-200/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Preview wajah"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

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

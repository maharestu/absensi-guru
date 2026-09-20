"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import CameraCapture from "@/components/absensi/camera-capture";

export default function HadirPage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleContinue = () => {
    // Navigate to location scanning page
    router.push("/absensi/hadir/lokasi");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">

      <PageHeader
        backHref="/pilih-status"
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
              <button
                onClick={handleContinue}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-semibold text-base transition-all duration-200 shadow-md shadow-blue-200"
              >
                Lanjutkan
              </button>

              <button
                onClick={handleRetake}
                className="w-full py-4 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 rounded-2xl font-semibold text-base transition-all duration-200"
              >
                Ulangi
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

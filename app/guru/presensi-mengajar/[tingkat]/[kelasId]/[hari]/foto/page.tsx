"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import CameraCapture from "@/components/absensi/camera-capture";
import Button from "@/components/ui/button";

export default function FotoMengajarPage() {
  const router = useRouter();
  const params = useParams();
  const tingkat = (params.tingkat as string) || "7";
  const kelasId = (params.kelasId as string) || "k-7a";
  const hari = (params.hari as string) || "senin";

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("absensi_mengajar_photo", imageSrc);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("absensi_mengajar_photo");
    }
  };

  const handleContinue = () => {
    router.push(
      `/guru/presensi-mengajar/verifikasi?tingkat=${tingkat}&kelas_id=${kelasId}&hari=${hari}`
    );
  };

  const handleBack = () => {
    if (capturedImage) {
      handleRetake();
    } else {
      router.push(`/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}/scan`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        onBack={handleBack}
        title="Ambil Foto Mengajar"
        subtitle="Pastikan wajah Anda terlihat jelas dan pencahayaan cukup."
      />

      <div className="flex flex-col items-center w-full">
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
                alt="Preview foto mengajar"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-3 mt-6 w-full">
              <Button onClick={handleContinue}>Lanjutkan</Button>
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

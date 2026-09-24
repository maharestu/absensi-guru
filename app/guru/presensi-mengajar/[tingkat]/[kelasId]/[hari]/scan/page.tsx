"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

export default function ScanQrKelasPage() {
  const router = useRouter();
  const params = useParams();
  const tingkat = (params.tingkat as string) || "7";
  const kelasId = (params.kelasId as string) || "k-7a";
  const hari = (params.hari as string) || "senin";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>("IDLE");

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
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

    if (scanState === "IDLE" || scanState === "SCANNING") {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanState]);

  const handleScan = () => {
    setScanState("SCANNING");
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      setScanState(isSuccess ? "SUCCESS" : "FAIL");
    }, 1200);
  };

  const handleRetake = () => {
    setScanState("IDLE");
  };

  const handleContinue = () => {
    router.push(`/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}/foto`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      {scanState === "IDLE" || scanState === "SCANNING" ? (
        <PageHeader
          backHref={`/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}`}
          title="Scan QR Kelas"
          subtitle="Arahkan kamera ke QR code kelas yang dipilih."
        />
      ) : scanState === "SUCCESS" ? (
        <PageHeader
          backHref={`/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}`}
          title="Scan QR Kelas"
          subtitle="QR code sudah valid"
        />
      ) : (
        <PageHeader
          backHref={`/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}`}
          title="Scan QR Kelas"
          subtitle="QR code tidak dapat diverifikasi."
        />
      )}

      {(scanState === "IDLE" || scanState === "SCANNING") && (
        <>
          <div className="relative w-full h-[450px] bg-[#0c1322] rounded-[28px] overflow-hidden shadow-lg flex items-center justify-center p-8 border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${hasPermission ? "opacity-70" : "hidden"}`}
            />

            <div className="relative z-10 w-[240px] h-[280px] flex items-center justify-center">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3.5px] border-l-[3.5px] border-white rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3.5px] border-r-[3.5px] border-white rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3.5px] border-l-[3.5px] border-white rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3.5px] border-r-[3.5px] border-white rounded-br-sm" />

              <span className="text-xs font-bold tracking-widest text-white/90 uppercase text-center px-4 py-2 bg-black/30 backdrop-blur-xs rounded-lg border border-white/10">
                {scanState === "SCANNING" ? "MEMINDAI QR..." : "AREA QR CODE"}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button onClick={handleScan} disabled={scanState === "SCANNING"}>
              {scanState === "SCANNING" ? "Memproses..." : "Scan QR Code"}
            </Button>
          </div>
        </>
      )}

      {scanState === "SUCCESS" && (
        <>
          <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
            <div className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-green-200">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13L9 17L19 7"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
              QR Code Kelas Sudah Valid
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              QR Code berhasil diverifikasi.
            </p>
          </div>

          <div className="w-full mt-30">
            <Button onClick={handleContinue}>Lanjutkan</Button>
          </div>
        </>
      )}

      {scanState === "FAIL" && (
        <>
          <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
            <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-red-200">
              <span className="font-bold text-2xl leading-none">!</span>
            </div>

            <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
              Qr Code Kelas Tidak Valid
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              QR tidak sesuai dengan kelas yang dipilih atau sudah tidak berlaku.
            </p>
          </div>

          <div className="w-full mt-30">
            <Button variant="outline" onClick={handleRetake}>
              Scan Ulang QR Code
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

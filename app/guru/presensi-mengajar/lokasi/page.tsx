"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { verifikasiLokasiMengajar } from "@/actions/presensi";
import { getJadwalById } from "@/actions/jadwal";
import { JadwalWithDetail } from "@/types/schema";

type ScanState = "IDLE" | "SCANNING" | "SUCCESS" | "FAIL";

function LokasiMengajarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");

  const [jadwal, setJadwal] = useState<JadwalWithDetail | null>(null);
  const [scanState, setScanState] = useState<ScanState>("IDLE");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [namaKelas, setNamaKelas] = useState<string>("");
  const [radiusToleransi, setRadiusToleransi] = useState<number>(5);

  useEffect(() => {
    async function loadJadwal() {
      if (!jadwalId) return;
      try {
        const data = await getJadwalById(jadwalId);
        if (data) {
          setJadwal(data);
          if (data.kelas?.nama_kelas) {
            setNamaKelas(data.kelas.nama_kelas);
          }
        }
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      }
    }
    loadJadwal();
  }, [jadwalId]);

  const handleScan = () => {
    if (!jadwalId) {
      setErrorMsg("ID Jadwal tidak ditemukan. Silakan scan ulang QR kelas.");
      setScanState("FAIL");
      return;
    }

    setScanState("SCANNING");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("Geolokasi tidak didukung oleh browser Anda.");
      setScanState("FAIL");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Verifikasi lokasi mengajar (prioritas: lokasi kelas spesifik, fallback: lokasi sekolah)
          const result = await verifikasiLokasiMengajar(jadwalId, userLat, userLng);

          if (!result.success) {
            setErrorMsg(result.error || "Gagal memverifikasi lokasi dengan server.");
            setScanState("FAIL");
            return;
          }

          if (result.isValid) {
            // Simpan koordinat dan status validasi lokasi untuk sesi mengajar
            sessionStorage.setItem("absensi_mengajar_lat", userLat.toString());
            sessionStorage.setItem("absensi_mengajar_lng", userLng.toString());
            sessionStorage.setItem("absensi_mengajar_location_valid", "true");
            if (result.namaKelas) setNamaKelas(result.namaKelas);
            if (result.radiusMeter) setRadiusToleransi(result.radiusMeter);
            setScanState("SUCCESS");
          } else {
            setErrorMsg(result.error || `Pastikan Anda berada di ruang ${namaKelas || "kelas"}.`);
            if (result.namaKelas) setNamaKelas(result.namaKelas);
            if (result.radiusMeter) setRadiusToleransi(result.radiusMeter);
            setScanState("FAIL");
          }
        } catch (err) {
          console.error("Gagal memeriksa lokasi mengajar:", err);
          setErrorMsg("Terjadi kesalahan saat memverifikasi lokasi.");
          setScanState("FAIL");
        }
      },
      (error) => {
        console.error("Gagal mendapatkan lokasi GPS:", error);
        setErrorMsg("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan browser mengakses lokasi.");
        setScanState("FAIL");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  };

  const handleRetake = () => {
    setScanState("IDLE");
  };

  const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
  const backHref = `/guru/presensi-mengajar/scan?jadwal_id=${jadwalId}${hariQuery}`;

  const handleContinue = () => {
    if (scanState !== "SUCCESS") return;
    router.push(`/guru/presensi-mengajar/foto?jadwal_id=${jadwalId}${hariQuery}`);
  };

  const displayKelas = namaKelas || jadwal?.kelas?.nama_kelas || "Ruang Kelas";

  return (
    <div className="flex flex-col min-h-full bg-[#EEF2F7] px-6 pt-3 pb-14">
      {scanState === "IDLE" || scanState === "SCANNING" ? (
        <PageHeader
          backHref={backHref}
          title="Cek Lokasi Mengajar"
          subtitle={`Pastikan lokasi Anda saat ini berada di area ${displayKelas}.`}
        />
      ) : scanState === "SUCCESS" ? (
        <PageHeader
          backHref={backHref}
          title="Lokasi Sesuai"
          subtitle={`Lokasi Anda telah terverifikasi berada di area ${displayKelas}.`}
        />
      ) : (
        <PageHeader
          backHref={backHref}
          title="Lokasi Tidak Sesuai"
          subtitle={`Absensi mengajar hanya dapat dilakukan di area ${displayKelas}.`}
        />
      )}

      {(scanState === "IDLE" || scanState === "SCANNING") && (
        <>
          <div className="w-full bg-white border border-slate-200 rounded-[20px] shadow-sm flex items-center justify-center py-8">
            <div className="w-full mx-4 bg-[#eaf5f0] border border-[#d1e8de] rounded-[16px] flex flex-col items-center justify-center gap-4 py-10">
              {scanState === "SCANNING" ? (
                <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <div className="text-blue-600">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="12" y1="2" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="12" y1="14.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="2" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="14.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className="text-center px-4">
                <h2 className="text-base font-bold text-slate-900">{displayKelas}</h2>
                {jadwal?.mata_pelajaran && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{jadwal.mata_pelajaran}</p>
                )}
              </div>
              <div className="bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-4 py-1 rounded-full tracking-widest">
                GPS AKTIF
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4">
            <Button
              onClick={handleScan}
              disabled={scanState === "SCANNING"}
            >
              {scanState === "SCANNING" ? "Memindai Lokasi..." : "Scan Lokasi"}
            </Button>
          </div>
        </>
      )}

      {scanState === "SUCCESS" && (
        <>
          <div className="w-full bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
            <div className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center shadow-md shadow-green-200">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
              Anda Sudah Berada Di<br />{displayKelas}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
              Koordinat perangkat Anda berhasil terverifikasi dalam jangkauan {displayKelas} (toleransi radius {radiusToleransi} meter).
            </p>
          </div>

          <div className="mt-10">
            <Button onClick={handleContinue}>
              Lanjutkan
            </Button>
          </div>
        </>
      )}

      {scanState === "FAIL" && (
        <>
          <div className="w-full bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6 py-10">
            <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center shadow-md shadow-red-200">
              <span className="text-white font-bold text-2xl leading-none">!</span>
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
              Anda Berada Di Luar<br />{displayKelas}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
              {errorMsg || `Pastikan Anda berada di ruang ${displayKelas} untuk melakukan absensi mengajar.`}
            </p>
          </div>

          <div className="mt-10">
            <Button onClick={handleRetake}>
              Pindai Ulang Lokasi
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function LokasiMengajarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-full items-center justify-center bg-[#EEF2F7] py-20">
          <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Memuat data lokasi kelas...</p>
        </div>
      }
    >
      <LokasiMengajarContent />
    </Suspense>
  );
}

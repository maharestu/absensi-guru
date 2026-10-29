"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import CameraCapture from "@/components/absensi/camera-capture";
import Button from "@/components/ui/button";
import LiburPauseScreen from "@/components/absensi/libur-pause-screen";
import { useAuth } from "@/context/AuthContext";
import { formatTanggalLengkap } from "@/lib/format";
import { formatJamWIB } from "@/lib/date";
import { getDevTestingConfigClient } from "@/lib/testing-mode";
import {
  getStatusOperasionalHariIni,
  StatusOperasionalHariIni,
} from "@/actions/pengaturan";
import { getDetailPresensiPulangHariIni } from "@/actions/presensi";

const PHOTO_STORAGE_KEY = "pulang_captured_photo";
const PHOTO_STATUS_KEY = "pulang_photo_status";

export default function PresensiPulangPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [waktuMasuk, setWaktuMasuk] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [notYetPresent, setNotYetPresent] = useState(false);
  const [statusNonHadir, setStatusNonHadir] = useState<string | null>(null);
  const [alreadyPulang, setAlreadyPulang] = useState(false);
  const [waktuPulangExisting, setWaktuPulangExisting] = useState<string | null>(null);
  const [statusOperasional, setStatusOperasional] = useState<StatusOperasionalHariIni | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const now = new Date();
  const today = formatTanggalLengkap(now);
  const nama = user?.nama ?? "-";
  const nip = user?.nip ?? "-";

  useEffect(() => {
    let isMounted = true;

    // Cek sessionStorage untuk foto yang tersimpan
    const photoStatus = sessionStorage.getItem(PHOTO_STATUS_KEY);
    const saved = sessionStorage.getItem(PHOTO_STORAGE_KEY);
    if (saved && photoStatus === "pulang") {
      setCapturedImage(saved);
    } else {
      sessionStorage.removeItem(PHOTO_STORAGE_KEY);
      sessionStorage.removeItem(PHOTO_STATUS_KEY);
      setCapturedImage(null);
    }

    getStatusOperasionalHariIni()
      .then((res) => {
        if (isMounted) setStatusOperasional(res);
      })
      .catch((err) => console.warn("getStatusOperasionalHariIni error:", err));

    async function checkStatus() {
      try {
        setLoading(true);
        const res = await getDetailPresensiPulangHariIni();
        if (!isMounted) return;

        if (!res.success) {
          setErrorMsg(res.error || "Gagal memverifikasi status kehadiran.");
          setCanAccess(false);
          setNotYetPresent(true);
        } else if (res.alreadyPulang) {
          setCanAccess(true);
          setAlreadyPulang(true);
          setWaktuMasuk(res.waktuMasuk ? formatJamWIB(res.waktuMasuk) : null);
          setWaktuPulangExisting(res.waktuPulang ? formatJamWIB(res.waktuPulang) : null);
        } else if (!res.canPulang) {
          setCanAccess(false);
          setNotYetPresent(Boolean(res.notYetPresent));
          setStatusNonHadir(res.statusNonHadir || null);
          setErrorMsg(res.message || "Presensi pulang belum dapat dilakukan.");
        } else {
          setCanAccess(true);
          setWaktuMasuk(res.waktuMasuk ? formatJamWIB(res.waktuMasuk) : null);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || "Terjadi kesalahan sistem.");
          setCanAccess(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    sessionStorage.setItem(PHOTO_STORAGE_KEY, imageSrc);
    sessionStorage.setItem(PHOTO_STATUS_KEY, "pulang");
  };

  const handleRetake = () => {
    setCapturedImage(null);
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
    sessionStorage.removeItem(PHOTO_STATUS_KEY);
  };

  const handleContinue = () => {
    router.push("/guru/presensi-pulang/lokasi");
  };

  const handleBack = () => {
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
    sessionStorage.removeItem(PHOTO_STATUS_KEY);
    setCapturedImage(null);
    router.push("/guru");
  };

  const testConfig = getDevTestingConfigClient();
  const isHolidayPause =
    !testConfig.isActive &&
    Boolean(statusOperasional && !statusOperasional.isOperasional);

  if (isHolidayPause && statusOperasional) {
    return (
      <LiburPauseScreen
        pageTitle="Absensi Pulang"
        subtitle={statusOperasional.judul}
        judul={statusOperasional.judul}
        deskripsi={statusOperasional.deskripsi}
        periode={statusOperasional.periode}
        keterangan={statusOperasional.keterangan}
        backHref="/guru"
      />
    );
  }

  if (loading || canAccess === null) {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-4 pb-20 animate-page-enter">
        <div className="max-w-md w-full mx-auto">
          <PageHeader
            backHref="/guru"
            title="Absensi Pulang"
            subtitle="Memeriksa prasyarat kehadiran..."
          />
          <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-12 text-center mt-2">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">
              Memeriksa status kehadiran hari ini...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── 1. Prasyarat Belum Terpenuhi: Belum Absen Kehadiran ──
  if (!canAccess && notYetPresent) {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-4 pb-20 animate-page-enter">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between">
          <div>
            <PageHeader
              backHref="/guru"
              title="Absensi Pulang Gagal"
              subtitle="Absensi pulang hanya bisa dilakukan setelah menyelesaikan absensi kehadiran."
            />

            <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
              <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-red-200">
                <span className="font-bold text-2xl leading-none">!</span>
              </div>

              <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
                Anda Belum Melakukan<br />Absensi Kehadiran
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Pastikan Anda sudah menyelesaikan absensi kehadiran dengan status <strong>Hadir</strong> terlebih dahulu sebelum melakukan absensi pulang.
              </p>

              <Button
                onClick={() => router.push("/guru/pilih-status")}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3 rounded-xl font-bold shadow-md shadow-green-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                Lakukan Absensi Kehadiran
              </Button>
            </div>
          </div>

          <div className="w-full pt-6">
            <Button variant="outline" onClick={() => router.push("/guru")}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Prasyarat Belum Terpenuhi: Status Kehadiran Bukan Hadir (Izin / Sakit / Dinas) ──
  if (!canAccess && !notYetPresent) {
    const labelStatus = statusNonHadir
      ? statusNonHadir.charAt(0).toUpperCase() + statusNonHadir.slice(1)
      : "Bukan Hadir";

    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-4 pb-20 animate-page-enter">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between">
          <div>
            <PageHeader
              backHref="/guru"
              title="Absensi Pulang Ditolak"
              subtitle="Absensi pulang hanya berlaku bagi guru yang hadir di sekolah."
            />

            <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
              <div className="w-14 h-14 bg-[#f59e0b] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-amber-200">
                <span className="font-bold text-2xl leading-none">!</span>
              </div>

              <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
                Status Kehadiran Anda:<br />
                <span className="text-amber-600 capitalize">{labelStatus}</span>
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                Hari ini Anda tercatat dengan status <strong>{labelStatus}</strong>. Absensi pulang hanya diperuntukkan bagi guru dengan kehadiran <strong>Hadir</strong> di sekolah.
              </p>
            </div>
          </div>

          <div className="w-full pt-6">
            <Button variant="outline" onClick={() => router.push("/guru")}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Tampilan Jika Guru Sudah Absen Pulang Hari Ini ──
  if (alreadyPulang) {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-3 pb-20 animate-page-enter">
        <PageHeader
          backHref="/guru"
          title="Absensi Pulang Hari Ini"
          subtitle="Status absensi pulang sudah tercatat."
        />

        <div className="max-w-md w-full mx-auto">
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
              Anda sudah absen pulang hari ini
            </h2>

            <p className="text-sm font-semibold text-[#16a34a] mb-6">
              Sudah Pulang
            </p>

            <div className="w-full border-b border-slate-100 mb-6" />

            <div className="flex flex-col gap-4 text-center w-full">
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Tanggal dan Waktu Absen Pulang
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {today} • {waktuPulangExisting} WIB
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">Nama</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{nama}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">NIP/NUPTK</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{nip}</p>
              </div>

              {waktuMasuk && (
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    Jam Masuk Hari Ini
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {waktuMasuk} WIB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Button onClick={() => router.push("/guru")}>
              Selesai
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. Langkah 1: Kamera Selfie Pulang (Jika canPulang = true) ──
  return (
    <div className="flex flex-col min-h-full bg-[#EEF2F7] px-6 pt-3 pb-14 animate-page-enter">
      <PageHeader
        onBack={handleBack}
        title={capturedImage ? "Ambil Foto Pulang" : "Ambil Foto Absensi Pulang"}
        subtitle="Pastikan wajah Anda terlihat jelas dan pencahayaan cukup."
      />

      <div className="-mt-2 flex flex-col items-center w-full">
        {!capturedImage ? (
          <div className="w-full max-w-[354px]">
            <CameraCapture onCapture={handleCapture} />
          </div>
        ) : (
          <div className="w-full max-w-[354px] flex flex-col">
            <div className="w-full aspect-[3/4] max-h-[56vh] min-h-[320px] relative bg-slate-200 rounded-[24px] overflow-hidden shadow-sm border border-slate-200/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Preview wajah pulang"
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

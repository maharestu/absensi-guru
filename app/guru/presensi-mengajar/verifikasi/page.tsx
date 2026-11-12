"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getJadwalById } from "@/actions/jadwal";
import { JadwalWithDetail } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
import {
  submitPresensiMengajarAction,
  cekStatusAbsensiMengajarJadwal,
} from "@/actions/presensi";
import {
  hitungKeterlambatan,
  formatJamWIB,
  TOLERANSI_TERLAMBAT_MENIT,
} from "@/lib/date";
import { formatTanggalLengkap } from "@/lib/format";
import FullScreenLoader from "@/components/ui/full-screen-loader";

function VerifikasiMengajarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jadwalId = searchParams.get("jadwal_id");
  const hari = searchParams.get("hari");
  const { user } = useAuth();

  const [jadwal, setJadwal] = useState<JadwalWithDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMengajar, setStatusMengajar] = useState<{
    completed: boolean;
    data: {
      id: string;
      jadwalId: string;
      tanggal: string;
      status: string;
      fotoAbsensi?: string;
      waktuSubmit?: string;
    } | null;
  } | null>(null);

  useEffect(() => {
    async function initData() {
      if (!jadwalId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Load detail jadwal dan cek status absensi mengajar hari ini secara paralel
        const [jadwalData, statusData] = await Promise.all([
          getJadwalById(jadwalId),
          cekStatusAbsensiMengajarJadwal(jadwalId),
        ]);
        setJadwal(jadwalData);
        setStatusMengajar(statusData);

        if (statusData.completed && statusData.data?.fotoAbsensi) {
          setPhotoUrl(statusData.data.fotoAbsensi);
        } else if (typeof window !== "undefined") {
          const saved = sessionStorage.getItem("absensi_mengajar_photo");
          if (saved) {
            setPhotoUrl(saved);
          } else {
            setPhotoUrl(null); // Tidak menggunakan foto hardcode dummy
          }
        }
      } catch (err) {
        console.error("Gagal memuat data verifikasi mengajar:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [jadwalId]);

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!photoUrl || !jadwalId || !user?.guru_id) {
      setSubmitError(
        "Data absensi atau foto belum lengkap. Silakan ambil foto terlebih dahulu."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert base64 photo to a File object
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const file = new File([blob], `mengajar_${jadwalId}.webp`, {
        type: "image/webp",
      });

      const formData = new FormData();
      formData.append("jadwalId", jadwalId);
      formData.append("guruId", user.guru_id as string);
      formData.append("file", file);

      const result = await submitPresensiMengajarAction(formData);

      if (result.success) {
        sessionStorage.removeItem("absensi_mengajar_photo");
        router.push("/guru/presensi-mengajar/berhasil");
      } else {
        setSubmitError(result.error || "Gagal menyimpan absensi mengajar.");
        // Jika jadwal ini sudah selesai diabsen, perbarui status cek
        if (result.error?.toLowerCase().includes("sudah")) {
          const refreshed = await cekStatusAbsensiMengajarJadwal(jadwalId);
          if (refreshed.completed) {
            setStatusMengajar(refreshed);
            if (refreshed.data?.fotoAbsensi) {
              setPhotoUrl(refreshed.data.fotoAbsensi);
            }
          }
        }
      }
    } catch (error: any) {
      setSubmitError(
        "Terjadi kesalahan sistem: " + (error?.message || "Silakan coba lagi.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
  const backToJadwalHref = hari
    ? `/guru/presensi-mengajar/${encodeURIComponent(hari)}`
    : `/guru/presensi-mengajar`;
  const backHref = statusMengajar?.completed
    ? backToJadwalHref
    : `/guru/presensi-mengajar/foto?jadwal_id=${jadwalId}${hariQuery}`;

  const now = new Date();
  const submitDate = statusMengajar?.data?.waktuSubmit
    ? new Date(statusMengajar.data.waktuSubmit)
    : now;
  const todayFormatted = formatTanggalLengkap(submitDate);
  const waktuAbsenStr = `${formatJamWIB(submitDate)} WIB`;
  const ketInfo = jadwal?.jam_mulai
    ? hitungKeterlambatan(submitDate, jadwal.jam_mulai, TOLERANSI_TERLAMBAT_MENIT)
    : null;

  if (loading) {
    return (
      <FullScreenLoader
        message="Memeriksa status absensi mengajar..."
        bgClass="bg-[#EEF2F7]"
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-full bg-[#EEF2F7] px-6 pt-3 pb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="w-11 h-11 bg-white border border-slate-200 rounded-[14px] flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Verifikasi Absensi
          </h1>
        </div>
      </div>

      <p className="text-[14px] text-slate-500 mb-5 leading-relaxed pr-4">
        {statusMengajar?.completed
          ? "Data absensi mengajar Anda telah tercatat dalam sistem."
          : "Pastikan data absensi mengajar Anda sudah benar."}
      </p>

      {/* State 1: Sudah Mengajar Hari Ini */}
      {statusMengajar?.completed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-4 flex items-center gap-3.5 mb-5 shadow-sm animate-in fade-in duration-200">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-emerald-950 text-sm sm:text-base">
              Absensi Mengajar Selesai
            </p>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Anda sudah menyelesaikan absensi mengajar untuk kelas ini hari ini.
            </p>
          </div>
        </div>
      )}

      {/* State 2: Peringatan Foto Belum Diambil */}
      {!statusMengajar?.completed && !photoUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex items-start gap-3.5 mb-5 shadow-sm animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-950 text-sm">Foto Belum Diambil</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Foto bukti kegiatan mengajar belum tersedia. Silakan ambil foto terlebih dahulu untuk melengkapi absensi.
            </p>
          </div>
        </div>
      )}

      {/* State 3: Error Banner saat Submit */}
      {submitError && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-[20px] flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-900">Perhatian</p>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{submitError}</p>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="text-rose-400 hover:text-rose-600 text-sm font-bold p-1 touch-manipulation cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}

      {/* Rincian Data Jadwal */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm px-5 py-2">
        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">
            Tanggal Absensi Mengajar
          </p>
          <p className="text-[15px] font-bold text-slate-900">{todayFormatted}</p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Nama</p>
          <p className="text-[15px] font-bold text-slate-900">
            {(Array.isArray(jadwal?.guru) ? jadwal?.guru[0]?.nama : jadwal?.guru?.nama) || "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Kelas</p>
          <p className="text-[15px] font-bold text-slate-900">
            {(Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0]?.nama_kelas : jadwal?.kelas?.nama_kelas) || "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Mata Pelajaran</p>
          <p className="text-[15px] font-bold text-slate-900">
            {jadwal?.mata_pelajaran || "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Jadwal</p>
          <p className="text-[15px] font-bold text-slate-900">
            {jadwal
              ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)} WIB`
              : "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Waktu Absensi</p>
          <p className="text-[15px] font-bold text-slate-900">{waktuAbsenStr}</p>
        </div>

        <div className="py-4">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Keterangan</p>
          <div>
            {statusMengajar?.completed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sudah Tercatat
              </span>
            ) : ketInfo ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ${
                  ketInfo.terlambat
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    ketInfo.terlambat ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                {ketInfo.label}
              </span>
            ) : (
              <span className="text-[15px] font-bold text-slate-900">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Foto Dokumentasi */}
      {photoUrl && (
        <div className="w-full relative rounded-[24px] overflow-hidden shadow-sm border border-slate-200 mt-5 mb-6 aspect-[4/3] bg-slate-100">
          <img
            src={photoUrl}
            alt="Foto Selfie Mengajar"
            className="w-full h-full object-cover"
          />
          {statusMengajar?.completed && (
            <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Foto Tersimpan
            </div>
          )}
        </div>
      )}

      {/* Bagian Tombol Aksi Bawah */}
      <div className="w-full mt-auto pt-6">
        {statusMengajar?.completed ? (
          <div className="flex flex-col gap-3">
            <Link
              href={backToJadwalHref}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-center rounded-[16px] font-bold shadow-sm transition-all"
            >
              Kembali ke Jadwal Mengajar
            </Link>
            <Link
              href="/guru"
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 text-center rounded-[16px] font-semibold border border-slate-200 transition-all text-sm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : !photoUrl ? (
          <div className="flex flex-col gap-3">
            <Link
              href={`/guru/presensi-mengajar/foto?jadwal_id=${jadwalId}${hariQuery}`}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-center rounded-[16px] font-bold shadow-sm transition-all"
            >
              Ambil Foto Sekarang
            </Link>
            <Link
              href={backToJadwalHref}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 text-center rounded-[16px] font-semibold border border-slate-200 transition-all text-sm"
            >
              Kembali ke Jadwal
            </Link>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-[16px] font-bold shadow-sm transition-all touch-manipulation cursor-pointer"
          >
            {isSubmitting ? "Mengirim..." : "Kirim"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifikasiMengajarPage() {
  return (
    <Suspense fallback={<FullScreenLoader bgClass="bg-[#EEF2F7]" />}>
      <VerifikasiMengajarContent />
    </Suspense>
  );
}
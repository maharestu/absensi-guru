"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getJadwalById } from "@/actions/jadwal";
import { JadwalWithDetail } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
import { submitPresensiMengajarAction } from "@/actions/presensi";

/** Format tanggal ke "Senin, 7 September 2026" */
function formatTanggal(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

  useEffect(() => {
    async function fetchJadwal() {
      if (jadwalId) {
        try {
          const data = await getJadwalById(jadwalId);
          setJadwal(data);
        } catch (err) {
          console.error("Gagal memuat detail jadwal:", err);
        }
      }
      setLoading(false);
    }
    fetchJadwal();
  }, [jadwalId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("absensi_mengajar_photo");
      if (saved) {
        setPhotoUrl(saved);
      } else {
        setPhotoUrl(
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
        );
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!photoUrl || !jadwalId || !user?.guru_id) {
      alert("Data tidak lengkap atau sesi Anda telah berakhir.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert base64 photo to a File object
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const file = new File([blob], `mengajar_${jadwalId}.jpg`, { type: "image/jpeg" });
      
      const formData = new FormData();
      formData.append("jadwalId", jadwalId);
      formData.append("guruId", user.guru_id as string);
      formData.append("file", file);
      
      const result = await submitPresensiMengajarAction(formData);
      
      if (result.success) {
        sessionStorage.removeItem("absensi_mengajar_photo");
        router.push("/guru/presensi-mengajar/berhasil");
      } else {
        alert("Gagal menyimpan absensi: " + result.error);
      }
    } catch (error: any) {
      alert("Terjadi kesalahan sistem: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
  const backHref = `/guru/presensi-mengajar/foto?jadwal_id=${jadwalId}${hariQuery}`;
  const todayFormatted = formatTanggal(new Date());

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] px-6 pt-3 pb-6">
      {/* Header Baru */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="w-11 h-11 bg-white border border-slate-200 rounded-[14px] flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Verifikasi Absensi
          </h1>
        </div>
      </div>
      <p className="text-[14px] text-slate-500 mb-6 leading-relaxed pr-4">
        Pastikan data absensi mengajar Anda sudah benar.
      </p>

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
            {loading ? "Memuat..." : (Array.isArray(jadwal?.guru) ? jadwal?.guru[0]?.nama : jadwal?.guru?.nama) || "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Kelas</p>
          <p className="text-[15px] font-bold text-slate-900">
            {loading ? "Memuat..." : (Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0]?.nama_kelas : jadwal?.kelas?.nama_kelas) || "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Mata Pelajaran</p>
          <p className="text-[15px] font-bold text-slate-900">
            {loading ? "Memuat..." : jadwal?.mata_pelajaran || "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4">
          <p className="text-[13px] font-medium text-slate-400 mb-1">Jadwal</p>
          <p className="text-[15px] font-bold text-slate-900">
            {loading ? "Memuat..." : jadwal ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)}` : "Tidak diketahui"}
          </p>
        </div>
      </div>

      {photoUrl && (
        <div className="w-full h-[220px] relative rounded-[28px] overflow-hidden shadow-sm border border-slate-200 mt-6 mb-8">
          <img
            src={photoUrl}
            alt="Foto Selfie Mengajar"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      <div className="w-full mt-auto">
        <button
          onClick={handleSubmit}
          disabled={loading || isSubmitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-[16px] font-bold shadow-sm transition-all"
        >
          {isSubmitting ? "Mengirim..." : "Kirim"}
        </button>
      </div>
    </div>
  );
}

export default function VerifikasiMengajarPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-[#EEF2F7]" />}>
      <VerifikasiMengajarContent />
    </Suspense>
  );
}
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { getJadwalById } from "@/actions/jadwal";
import { JadwalWithDetail } from "@/types/schema";

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

  const [jadwal, setJadwal] = useState<JadwalWithDetail | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSubmit = () => {
    router.push("/guru/presensi-mengajar/berhasil");
  };

  const hariQuery = hari ? `&hari=${encodeURIComponent(hari)}` : "";
  const backHref = `/guru/presensi-mengajar/foto?jadwal_id=${jadwalId}${hariQuery}`;
  const todayFormatted = formatTanggal(new Date());

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref={backHref}
        title="Verifikasi Absensi"
        subtitle="Pastikan data absensi mengajar Anda sudah benar."
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-1">
        <div className="py-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 mb-1">
            Tanggal Absensi Mengajar
          </p>
          <p className="text-base font-bold text-slate-900">{todayFormatted}</p>
        </div>

        <div className="py-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 mb-1">
            Kelas / Mata Pelajaran
          </p>
          <p className="text-base font-bold text-slate-900">
            {loading ? "Memuat..." : jadwal ? `${jadwal.kelas?.nama_kelas} • ${jadwal.mata_pelajaran}` : "Tidak diketahui"}
          </p>
        </div>

        <div className="py-4">
          <p className="text-xs font-medium text-slate-400 mb-1">Jadwal</p>
          <p className="text-base font-bold text-slate-900">
             {loading ? "Memuat..." : jadwal ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)}` : "Tidak diketahui"}
          </p>
        </div>
      </div>

      {photoUrl && (
        <div className="w-full h-[240px] sm:h-[260px] relative bg-slate-200 rounded-[24px] overflow-hidden shadow-sm border border-slate-200/60 mt-6">
          <img
            src={photoUrl}
            alt="Foto Selfie Mengajar"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Dengan mengklik konfirmasi, saya menyatakan bahwa saya benar-benar mengajar di kelas ini sesuai jadwal yang tertera.
        </p>
      </div>

      <div className="w-full mt-auto pt-8">
        <Button onClick={handleSubmit} disabled={loading}>Konfirmasi & Simpan</Button>
      </div>
    </div>
  );
}

export default function VerifikasiMengajarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F7]" />}>
      <VerifikasiMengajarContent />
    </Suspense>
  );
}
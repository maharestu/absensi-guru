"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { getKelasById } from "@/actions/kelas";
import { Kelas } from "@/types/schema";

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

  const tingkat = searchParams.get("tingkat") || "7";
  const kelasId = searchParams.get("kelas_id") || "";
  const hari = searchParams.get("hari") || "senin";

  const [kelas, setKelas] = useState<Kelas | null>(null);

  useEffect(() => {
    if (kelasId) {
      getKelasById(kelasId).then(setKelas).catch(console.error);
    }
  }, [kelasId]);

  const namaKelas = kelas ? kelas.nama_kelas : `Kelas ${tingkat}`;

  const todayFormatted = formatTanggal(new Date());
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

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

  const backHref = `/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}/foto`;

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
            {namaKelas} • Ilmu Pengetahuan Alam
          </p>
        </div>

        <div className="py-4">
          <p className="text-xs font-medium text-slate-400 mb-1">Jadwal</p>
          <p className="text-base font-bold text-slate-900">06:30 - 08:30</p>
        </div>
      </div>

      {photoUrl && (
        <div className="w-full h-[240px] sm:h-[260px] relative bg-slate-200 rounded-[24px] overflow-hidden shadow-sm border border-slate-200/60 mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Foto Selfie Mengajar"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      <div className="w-full max-w-[354px] mt-10">
        <Button onClick={handleSubmit}>Submit</Button>
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

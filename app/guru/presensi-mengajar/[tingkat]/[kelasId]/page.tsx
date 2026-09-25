"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { getKelasById } from "@/actions/kelas";
import { Kelas } from "@/types/schema";

const DAFTAR_HARI = [
  { id: "senin", label: "Senin" },
  { id: "selasa", label: "Selasa" },
  { id: "rabu", label: "Rabu" },
  { id: "kamis", label: "Kamis" },
  { id: "jumat", label: "Jumat" },
];

export default function DaftarHariPage() {
  const router = useRouter();
  const params = useParams();
  const tingkat = (params.tingkat as string) || "7";
  const kelasId = (params.kelasId as string) || "";
  const [kelas, setKelas] = useState<Kelas | null>(null);

  useEffect(() => {
    if (kelasId) {
      getKelasById(kelasId).then(setKelas).catch(console.error);
    }
  }, [kelasId]);

  const title = kelas ? kelas.nama_kelas : `Kelas ${tingkat}`;

  const handleSelectHari = (hariId: string) => {
    router.push(`/guru/presensi-mengajar/${tingkat}/${kelasId}/${hariId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref={`/guru/presensi-mengajar/${tingkat}`}
        title={title}
        subtitle="Pilih hari yang sesuai dengan hari ini."
      />

      <h2 className="text-sm font-bold text-slate-900 -mt-6 mb-6">Daftar Hari</h2>

      <div className="flex flex-col gap-10">
        {DAFTAR_HARI.map((hari) => (
          <button
            key={hari.id}
            onClick={() => handleSelectHari(hari.id)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
          >
            <span className="text-base font-bold text-slate-900">
              {hari.label}
            </span>
            <div className="flex-shrink-0 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

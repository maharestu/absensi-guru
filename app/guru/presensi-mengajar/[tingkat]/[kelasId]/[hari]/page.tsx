"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { MOCK_KELAS, MOCK_DEFAULT_MATPEL } from "@/lib/mock-data";

export default function DaftarMataPelajaranPage() {
  const router = useRouter();
  const params = useParams();
  const tingkat = (params.tingkat as string) || "7";
  const kelasId = (params.kelasId as string) || "k-7a";
  const hari = (params.hari as string) || "senin";

  const targetKelas = MOCK_KELAS.find((k) => k.id === kelasId);
  const title = targetKelas ? targetKelas.nama_kelas : `Kelas ${tingkat}A`;

  const handleSelectMatpel = (matpelId: string) => {
    router.push(
      `/guru/presensi-mengajar/${tingkat}/${kelasId}/${hari}/scan?matpel_id=${matpelId}`
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref={`/guru/presensi-mengajar/${tingkat}/${kelasId}`}
        title={title}
        subtitle="Pilih mata pelajaran yang akan diajar."
      />

      <h2 className="text-sm font-bold text-slate-900 -mt-6 mb-6">
        Daftar Mata Pelajaran
      </h2>

      <div className="flex flex-col gap-10">
        {MOCK_DEFAULT_MATPEL.map((matpel) => (
          <button
            key={matpel.id}
            onClick={() => handleSelectMatpel(matpel.id)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
          >
            <div>
              <p className="text-base font-bold text-slate-900">
                {matpel.mata_pelajaran}
              </p>
              <p className="text-xs text-slate-500 mt-1">{matpel.jam}</p>
            </div>
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

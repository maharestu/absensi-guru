"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { MOCK_KELAS } from "@/lib/mock-data";

export default function SubKelasPage() {
  const router = useRouter();
  const params = useParams();
  const tingkat = (params.tingkat as string) || "7";

  // Filter sub-kelas berdasarkan tingkat (misal: "7" -> filter kelas yang mengandung "Kelas 7")
  const subKelasList = MOCK_KELAS.filter((k) =>
    k.nama_kelas.startsWith(`Kelas ${tingkat}`)
  );

  const handleSelectSubKelas = (kelasId: string) => {
    router.push(`/absensi-mengajar/${tingkat}/${kelasId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/absensi-mengajar"
        title={`Kelas ${tingkat}`}
        subtitle="Pilih kelas yang akan diajar hari ini."
      />

      {/* Section Header */}
      <h2 className="text-sm font-bold text-slate-900 -mt-6 mb-6">
        Daftar Sub Kelas
      </h2>

      {/* List Sub Kelas */}
      <div className="flex flex-col gap-10">
        {subKelasList.map((kelas) => (
          <button
            key={kelas.id}
            onClick={() => handleSelectSubKelas(kelas.id)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
          >
            <span className="text-base font-bold text-slate-900">
              {kelas.nama_kelas}
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

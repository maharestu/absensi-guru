"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { getKelasById } from "@/actions/kelas";
import { getJadwalByGuruAndHari } from "@/actions/jadwal";
import { useAuth } from "@/context/AuthContext";
import { JadwalWithDetail, Kelas } from "@/types/schema";

export default function DaftarMataPelajaranPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const tingkat = (params.tingkat as string) || "7";
  const kelasId = (params.kelasId as string) || "";
  const hari = (params.hari as string) || "senin";

  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [jadwalList, setJadwalList] = useState<JadwalWithDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (kelasId) {
          const k = await getKelasById(kelasId);
          setKelas(k);
        }
        // Ambil jadwal berdasarkan guru yang sedang login (user.guru_id), kelas, dan hari
        const data = await getJadwalByGuruAndHari(
          user?.guru_id || undefined,
          kelasId || undefined,
          hari
        );
        setJadwalList(data);
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [kelasId, hari, user?.guru_id]);

  const title = kelas ? kelas.nama_kelas : `Kelas ${tingkat}`;

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
        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-500 font-medium">
            Memuat jadwal...
          </div>
        ) : jadwalList.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-500 font-medium">
            Tidak ada jadwal mengajar untuk hari ini di kelas ini.
          </div>
        ) : (
          jadwalList.map((j) => (
            <button
              key={j.id}
              onClick={() => handleSelectMatpel(j.id)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
            >
              <div>
                <p className="text-base font-bold text-slate-900">
                  {j.mata_pelajaran}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                </p>
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
          ))
        )}
      </div>
    </div>
  );
}

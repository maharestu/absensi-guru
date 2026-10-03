"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { getJadwalByGuruAndHari } from "@/actions/jadwal";
import { useAuth } from "@/context/AuthContext";
import { JadwalWithDetail } from "@/types/schema";

export default function DaftarJadwalHarianPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const hari = (params.hari as string) || "senin";

  const [jadwalList, setJadwalList] = useState<JadwalWithDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return; // tunggu auth selesai
      if (!user?.guru_id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getJadwalByGuruAndHari(
          user.guru_id,
          undefined,
          hari
        );
        
        const sortedData = data.sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
        setJadwalList(sortedData);
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [hari, user, authLoading]);

  const hariLabel = hari.charAt(0).toUpperCase() + hari.slice(1);

  const handleSelectJadwal = (jadwalId: string) => {
    router.push(`/guru/presensi-mengajar/scan?jadwal_id=${jadwalId}&hari=${encodeURIComponent(hari)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/guru/presensi-mengajar"
        title={`Jadwal ${hariLabel}`}
        subtitle="Pilih jadwal kelas yang akan Anda ajar."
      />

      <h2 className="text-sm font-bold text-slate-900 -mt-6 mb-6">
        Daftar Kelas Anda
      </h2>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-500 font-medium">
            Memuat jadwal...
          </div>
        ) : jadwalList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada jadwal</p>
            <p className="text-xs text-slate-500 mt-1">Anda tidak memiliki jadwal mengajar di hari {hariLabel}.</p>
          </div>
        ) : (
          jadwalList.map((j) => (
            <button
              key={j.id}
              onClick={() => handleSelectJadwal(j.id)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-md">
                    {j.kelas?.nama_kelas || "Kelas ?"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {j.mata_pelajaran}
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
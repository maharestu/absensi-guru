"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getJadwalByGuruAndHari } from "@/actions/jadwal";
import { JadwalWithDetail } from "@/types/schema";

const HARI_LABEL: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
};

// Urutan hari yang benar
const HARI_ORDER = ["senin", "selasa", "rabu", "kamis", "jumat"];

export default function PresensiMengajarPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [hariList, setHariList] = useState<string[]>([]);
  const [jadwalMap, setJadwalMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = sessionStorage.getItem("absensi_completed") === "true";
      const status = sessionStorage.getItem("absensi_status");

      if (completed && status === "hadir") {
        setCanAccess(true);
      } else {
        setCanAccess(false);
      }
    }
  }, []);

  // Ambil semua jadwal milik guru ini, lalu ekstrak hari-hari uniknya
  useEffect(() => {
    async function loadJadwal() {
      if (authLoading) return; // tunggu auth selesai load dari localStorage
      if (!user?.guru_id) {
        setLoading(false);
        return;
      }

      try {
        // Ambil semua jadwal guru (tanpa filter hari)
        const allJadwal = await getJadwalByGuruAndHari(user.guru_id, undefined, undefined);

        // Hitung jumlah jadwal per hari
        const countMap: Record<string, number> = {};
        allJadwal.forEach((j: JadwalWithDetail) => {
          const h = j.hari.toLowerCase();
          countMap[h] = (countMap[h] || 0) + 1;
        });

        // Urutkan sesuai urutan hari
        const uniqueHari = HARI_ORDER.filter((h) => countMap[h] > 0);

        setHariList(uniqueHari);
        setJadwalMap(countMap);
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setLoading(false);
      }
    }

    loadJadwal();
  }, [user, authLoading]);

  const handleSelectHari = (hariId: string) => {
    router.push(`/guru/presensi-mengajar/${hariId}`);
  };

  if (canAccess === null) {
    return <div className="min-h-screen bg-[#EEF2F7]" />;
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
        <PageHeader
          backHref="/guru"
          title="Absensi Mengajar Gagal"
          subtitle="Absensi mengajar hanya bisa dilakukan setelah menyelesaikan absensi kehadiran."
        />

        <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
          <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-red-200">
            <span className="font-bold text-2xl leading-none">!</span>
          </div>

          <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
            Anda Belum Melakukan<br />Absensi Kehadiran
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed">
            Pastikan Anda sudah menyelesaikan absensi kehadiran terlebih dahulu.
          </p>
        </div>

        <div className="w-full mt-10">
          <Button variant="outline" onClick={() => router.push("/guru")}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/guru"
        title="Absensi Mengajar"
        subtitle="Pilih hari untuk melihat jadwal mengajar Anda."
      />

      <h2 className="text-sm font-bold text-slate-900 -mt-6 mb-6">Pilih Hari</h2>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-500 font-medium">
            Memuat jadwal...
          </div>
        ) : hariList.length === 0 ? (
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
            <p className="text-xs text-slate-500 mt-1">Anda belum memiliki jadwal mengajar.</p>
          </div>
        ) : (
          hariList.map((hariId) => (
            <button
              key={hariId}
              onClick={() => handleSelectHari(hariId)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
            >
              <div>
                <span className="text-base font-bold text-slate-900">
                  {HARI_LABEL[hariId] || hariId}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {jadwalMap[hariId]} jadwal mengajar
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
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { validasiQrMengajar } from "@/actions/presensi";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";

type FlowState = "LOADING" | "ERROR" | "INFO" | "PILIH_JADWAL";

export default function AbsenQrPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const kode = (params.kode as string) || "";

  const [flowState, setFlowState] = useState<FlowState>("LOADING");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState("");
  const [jadwalOptions, setJadwalOptions] = useState<any[]>([]);
  const [namaKelas, setNamaKelas] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Belum login, redirect
      router.push(`/login?next=/absen-qr/${encodeURIComponent(kode)}`);
      return;
    }

    if (user.role !== "guru") {
      setFlowState("ERROR");
      setErrorMessage("Halaman ini khusus untuk peran Guru.");
      return;
    }

    // Eksekusi validasi server
    async function cekQr() {
      if (!navigator.geolocation) {
        setFlowState("ERROR");
        setErrorMessage("GPS tidak didukung oleh browser Anda.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const res = await validasiQrMengajar(user!.guru_id as string, kode, lat, lng);
            
            if (!res.ok) {
              setErrorType(res.error || "SYSTEM_ERROR");
              setErrorMessage(res.message || "Terjadi kesalahan.");
              setFlowState("ERROR");
              return;
            }

            if (res.jadwal!.length === 1) {
              // Langsung redirect ke foto
              router.push(`/guru/presensi-mengajar/foto?jadwal_id=${res.jadwal![0].id}`);
            } else {
              // Lebih dari 1 jadwal (misal 2 mapel beda di kelas & hari & waktu yg tumpang tindih)
              setNamaKelas(res.kelas!);
              setJadwalOptions(res.jadwal!);
              setFlowState("PILIH_JADWAL");
            }

          } catch (err) {
            console.error(err);
            setFlowState("ERROR");
            setErrorMessage("Terjadi kesalahan sistem saat memvalidasi QR.");
          }
        },
        (err) => {
          setFlowState("ERROR");
          setErrorMessage("Gagal mendapatkan lokasi GPS. Pastikan izin lokasi aktif.");
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }

    cekQr();
  }, [user, isLoading, kode, router]);

  if (isLoading || flowState === "LOADING") {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10 justify-center items-center text-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Mengecek Lokasi & QR...</h2>
        <p className="text-sm text-slate-500">Memeriksa posisi Anda dan jadwal ruangan.</p>
      </div>
    );
  }

  if (flowState === "ERROR") {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
        <PageHeader title="Gagal" subtitle="Validasi QR Code Gagal" />
        <div className="w-full bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col items-center justify-center gap-3 text-center px-6 py-10 mt-10">
          <div className="w-14 h-14 bg-[#ef4444] rounded-full flex items-center justify-center shadow-md shadow-red-200">
            <span className="text-white font-bold text-2xl leading-none">!</span>
          </div>
          <h2 className="text-[20px] font-bold text-slate-900 leading-tight">
            Absensi Ditolak
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">
            {errorMessage}
          </p>
        </div>

        <div className="mt-auto pt-10 pb-4">
          {errorType === "BELUM_HADIR" ? (
            <Button onClick={() => router.push("/guru/pilih-status")}>
              Lakukan Absen Hadir
            </Button>
          ) : (
            <Button onClick={() => router.push("/guru")}>
              Kembali ke Beranda
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (flowState === "PILIH_JADWAL") {
    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
        <PageHeader title="Pilih Jadwal" subtitle={`Anda memiliki beberapa jadwal aktif di ${namaKelas}.`} />
        
        <div className="mt-8 flex flex-col gap-4">
          {jadwalOptions.map(j => (
            <div 
              key={j.id}
              onClick={() => router.push(`/guru/presensi-mengajar/foto?jadwal_id=${j.id}`)}
              className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <h3 className="text-lg font-bold text-slate-900">{j.mata_pelajaran}</h3>
              <p className="text-sm text-slate-500 mt-1">
                Jam {j.jam_mulai.substring(0,5)} - {j.jam_selesai.substring(0,5)} WIB
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-10 pb-4">
          <Button variant="outline" onClick={() => router.push("/guru")}>
            Batal
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

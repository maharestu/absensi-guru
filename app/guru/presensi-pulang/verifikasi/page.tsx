"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import VerificationCard from "@/components/absensi/verification-card";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { formatTanggalLengkap } from "@/lib/format";
import { formatJamWIB } from "@/lib/date";
import {
  getDetailPresensiPulangHariIni,
  submitPresensiPulangAction,
} from "@/actions/presensi";

export default function PresensiPulangVerifikasiPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [waktuMasuk, setWaktuMasuk] = useState<string | null>(null);

  const now = new Date();
  const today = formatTanggalLengkap(now);
  const waktuPulangSaatIni = `${formatJamWIB(now)} WIB`;
  const nama = user?.nama ?? "-";
  const nip = user?.nip ?? "-";

  useEffect(() => {
    let isMounted = true;

    // Cek foto di sessionStorage
    const savedPhoto = sessionStorage.getItem("pulang_captured_photo");
    if (!savedPhoto) {
      router.replace("/guru/presensi-pulang");
      return;
    }

    // Ambil detail jam masuk
    async function loadDetail() {
      try {
        setLoading(true);
        const res = await getDetailPresensiPulangHariIni();
        if (!isMounted) return;

        if (res.success && res.waktuMasuk) {
          setWaktuMasuk(formatJamWIB(res.waktuMasuk));
        }
      } catch (err: any) {
        console.error("Gagal memuat detail presensi masuk:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const photoBase64 = sessionStorage.getItem("pulang_captured_photo");
      if (!photoBase64) {
        throw new Error("Foto absensi tidak ditemukan. Silakan ulangi langkah foto.");
      }

      // Konversi base64 ke File WebP
      const res = await fetch(photoBase64);
      const blob = await res.blob();
      const file = new File([blob], "foto_pulang.webp", { type: "image/webp" });

      const formData = new FormData();
      formData.append("file", file);

      const lat = sessionStorage.getItem("pulang_lat");
      const lng = sessionStorage.getItem("pulang_lng");
      if (lat) formData.append("latitude", lat);
      if (lng) formData.append("longitude", lng);

      const result = await submitPresensiPulangAction(formData);
      if (!result.success) {
        throw new Error(result.error || "Gagal mengirim absensi pulang.");
      }

      // Bersihkan sessionStorage
      sessionStorage.removeItem("pulang_captured_photo");
      sessionStorage.removeItem("pulang_photo_status");
      sessionStorage.removeItem("pulang_lat");
      sessionStorage.removeItem("pulang_lng");

      router.push("/guru/presensi-pulang/berhasil");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan absensi pulang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = [
    { label: "Tanggal Absensi Pulang", value: today },
    { label: "Waktu Pulang", value: waktuPulangSaatIni },
    { label: "Nama Guru", value: nama },
    { label: "NIP / NUPTK", value: nip },
    ...(waktuMasuk
      ? [
          {
            label: "Jam Masuk Hari Ini",
            value: `${waktuMasuk} WIB`,
          },
        ]
      : []),
    {
      label: "Status",
      value: (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold bg-amber-50 text-amber-600 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Absen Pulang
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] animate-page-enter">
      <div className="max-w-md w-full mx-auto px-4 pt-4">
        <PageHeader title="Verifikasi Absen Pulang" backHref="/guru/presensi-pulang/lokasi" />
      </div>

      <div className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-between">
        <div className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2" />
              <p className="text-xs text-slate-400">Memuat rincian...</p>
            </div>
          ) : (
            <VerificationCard rows={rows} />
          )}
        </div>

        <div className="pt-6 pb-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 rounded-xl font-bold shadow-md shadow-green-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isSubmitting ? "Menyimpan Absensi Pulang..." : "Kirim Absensi Pulang"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import VerificationCard from "@/components/absensi/verification-card";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/** Format tanggal ke "Senin, 7 September 2026" */
function formatTanggal(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  dinas: "Dinas Keluar",
  mengajar: "Mengajar",
};

/** Peta status → URL back */
const BACK_HREF: Record<string, string> = {
  hadir: "/guru/presensi/hadir/lokasi",
  sakit: "/guru/presensi/sakit",
  izin: "/guru/presensi/izin",
  dinas: "/guru/presensi/dinas",
  mengajar: "/guru/presensi-mengajar",
};

function VerifikasiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const status = searchParams.get("status") ?? "hadir";
  const statusLabel = STATUS_LABELS[status] ?? status;
  const backHref = BACK_HREF[status] ?? "/guru";

  const today = formatTanggal(new Date());
  const nama = user?.nama ?? "-";
  const nip = user?.nip ?? "-";

  const rows = [
    { label: "Tanggal Absensi Kehadiran", value: today },
    { label: "Nama", value: nama },
    { label: "NIP", value: nip },
    { label: "Status Kehadiran", value: statusLabel },
  ];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const photoBase64 = sessionStorage.getItem("absensi_captured_photo");
      if (!photoBase64) {
        throw new Error("Foto absensi tidak ditemukan. Silakan ulangi.");
      }

      // Convert base64 to Blob/File
      const res = await fetch(photoBase64);
      const blob = await res.blob();
      const file = new File([blob], "foto.webp", { type: "image/webp" });

      const formData = new FormData();
      formData.append("file", file);
      
      const guruId = user?.guru_id;
      if (!guruId) throw new Error("ID Guru tidak valid.");
      formData.append("guruId", guruId);
      
      // Gunakan tanggal lokal YYYY-MM-DD
      const now = new Date();
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
      formData.append("tanggal", localDate);

      if (status === "mengajar") {
        const jadwalId = sessionStorage.getItem("absensi_jadwal_id");
        if (!jadwalId) throw new Error("Jadwal ID tidak ditemukan.");
        formData.append("jadwalId", jadwalId);
        
        const { submitPresensiMengajarAction } = await import("@/actions/presensi");
        const result = await submitPresensiMengajarAction(formData);
        if (!result.success) throw new Error(result.error);
      } else {
        formData.append("status", status);
        if (status === "hadir") {
          const lat = sessionStorage.getItem("absensi_lat");
          const lng = sessionStorage.getItem("absensi_lng");
          if (lat) formData.append("latitude", lat);
          if (lng) formData.append("longitude", lng);
        }

        const { submitPresensiMasukAction } = await import("@/actions/presensi");
        const result = await submitPresensiMasukAction(formData);
        if (!result.success) throw new Error(result.error);
      }

      // Bersihkan session storage
      sessionStorage.removeItem("absensi_captured_photo");
      sessionStorage.removeItem("absensi_lat");
      sessionStorage.removeItem("absensi_lng");
      sessionStorage.removeItem("absensi_jadwal_id");

      router.push(`/guru/presensi/berhasil?status=${status}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan presensi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#EEF2F7] px-6 pt-3 pb-10">
      <PageHeader
        backHref={backHref}
        title="Verifikasi Absensi"
        subtitle="Pastikan data absensi Anda kehadiran sudah benar."
      />

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <VerificationCard rows={rows} />

      <div className="mt-5">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Mengirim..." : "Kirim"}
        </Button>
      </div>
    </div>
  );
}

export default function VerifikasiAbsensiPage() {
  return (
    <Suspense fallback={<div className="min-h-full bg-[#EEF2F7]" />}>
      <VerifikasiContent />
    </Suspense>
  );
}

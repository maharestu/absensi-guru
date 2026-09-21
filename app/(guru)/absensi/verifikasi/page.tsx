"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/ui/page-header";
import VerificationCard from "@/components/absensi/verification-card";
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
};

/** Peta status → URL back */
const BACK_HREF: Record<string, string> = {
  hadir: "/absensi/hadir/lokasi",
  sakit: "/absensi/sakit",
  izin: "/absensi/izin",
};

function VerifikasiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const status = searchParams.get("status") ?? "hadir";
  const statusLabel = STATUS_LABELS[status] ?? status;
  const backHref = BACK_HREF[status] ?? "/dashboard";

  const today = formatTanggal(new Date());
  const nip = user?.username ?? "-";

  const rows = [
    { label: "Tanggal Absensi Kehadiran", value: today },
    { label: "NIP", value: nip },
    { label: "Status Kehadiran", value: statusLabel },
  ];

  const handleSubmit = () => {
    // TODO: Kirim data absensi ke server
    if (status === "hadir") {
      router.push("/absensi/hadir/berhasil");
    } else {
      alert(`Absensi "${statusLabel}" berhasil dicatat!`);
      router.push("/dashboard");
    }
  };

  return (
    /* flex-col full height → tombol didorong ke bawah */
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">

      <PageHeader
        backHref={backHref}
        title="Verifikasi Absensi"
        subtitle="Pastikan data absensi Anda kehadiran sudah benar."
      />

      {/* Kartu Data — tinggi natural */}
      <VerificationCard rows={rows} />

      {/* mt-12 → tombol di bawah kartu dengan jarak proporsional */}
      <div className="mt-40">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-base transition-all duration-150 shadow-md shadow-blue-200"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

// Suspense wajib karena useSearchParams() butuh Suspense boundary di Next.js
export default function VerifikasiAbsensiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2F7]" />}>
      <VerifikasiContent />
    </Suspense>
  );
}

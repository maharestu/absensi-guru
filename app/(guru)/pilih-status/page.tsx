"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  hadir: { label: "Hadir", color: "text-[#16a34a]" },
  sakit: { label: "Sakit", color: "text-[#16a34a]" },
  izin: { label: "Izin", color: "text-[#16a34a]" },
};

const statusOptions = [
  {
    id: "hadir",
    label: "Hadir",
    description: "Saya berada di sekolah",
    bgColor: "bg-green-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 13L9 17L19 7"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "sakit",
    label: "Sakit",
    description: "Dengan surat keterangan",
    bgColor: "bg-red-500",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5V12M12 12H19M12 12H5M12 12V19"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "izin",
    label: "Izin",
    description: "Dengan surat izin",
    bgColor: "bg-orange-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="1.5" fill="white" />
        <path
          d="M12 11V17"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

/** Format tanggal & waktu dinamis hari ini dalam bahasa Indonesia */
function getDynamicDateTime() {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return {
    date: `${dayName}, ${date} ${month} ${year}`,
    time: `${hours}:${minutes} WIB`,
  };
}

export default function PilihStatusPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAlreadyAbsen, setIsAlreadyAbsen] = useState<boolean | null>(null);
  const [absenData, setAbsenData] = useState<{
    status: string;
    time: string;
    date: string;
  }>({
    status: "hadir",
    time: "",
    date: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = sessionStorage.getItem("absensi_completed") === "true";
      const dynamic = getDynamicDateTime();
      if (completed) {
        setIsAlreadyAbsen(true);
        setAbsenData({
          status: sessionStorage.getItem("absensi_status") ?? "hadir",
          time: sessionStorage.getItem("absensi_time") ?? dynamic.time,
          date: sessionStorage.getItem("absensi_date") ?? dynamic.date,
        });
      } else {
        setIsAlreadyAbsen(false);
      }
    }
  }, []);

  const handleSelect = (statusId: string) => {
    router.push(`/absensi/${statusId}`);
  };

  if (isAlreadyAbsen === null) {
    return <div className="min-h-screen bg-[#EEF2F7]" />;
  }

  // Tampilan jika user sudah absen hari ini
  if (isAlreadyAbsen) {
    const currentStatus = STATUS_LABELS[absenData.status] ?? {
      label: "Hadir",
      color: "text-[#16a34a]",
    };
    const nip = user?.username ?? "1234567890";

    return (
      <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
        <PageHeader
          title="Absensi Hari Ini"
          subtitle="Status absensi kehadiran sudah tercatat."
        />

        {/* Card Tampilan Sudah Absen */}
        <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-2">
          {/* Green Checkmark Circle */}
          <div className="w-14 h-14 bg-[#16a34a] rounded-full flex items-center justify-center text-white mb-5 shadow-md shadow-green-200">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13L9 17L19 7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
            Anda sudah absen hari ini
          </h2>

          <p className={`text-sm font-semibold ${currentStatus.color} mb-6`}>
            {currentStatus.label} • {absenData.time}
          </p>

          {/* Divider Line */}
          <div className="w-full border-b border-slate-100 mb-6" />

          {/* Details */}
          <div className="flex flex-col gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tanggal Absensi</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{absenData.date}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">NIP</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{nip}</p>
            </div>
          </div>
        </div>

        {/* Tombol Selesai */}
        <div className="mt-60">
          <Button onClick={() => router.push("/dashboard")}>
            Selesai
          </Button>
        </div>
      </div>
    );
  }

  // Tampilan pilihan status (jika belum absen)
  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/dashboard"
        title="Pilih Status Kehadiran"
        subtitle="Pilih kondisi kehadiran anda hari ini."
      />

      {/* Status Cards */}
      <div className="flex flex-col gap-4">
        {statusOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-all duration-150 hover:shadow-md text-left"
          >
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-2xl ${option.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              {option.icon}
            </div>

            {/* Text */}
            <div>
              <p className="text-base font-bold text-slate-900">{option.label}</p>
              <p className="text-sm text-slate-500 mt-0.5">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

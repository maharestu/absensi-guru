"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";

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

export default function PilihStatusPage() {
  const router = useRouter();

  const handleSelect = (statusId: string) => {
    router.push(`/absensi/${statusId}`);
  };

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

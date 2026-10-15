"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { getDynamicDateTime } from "@/lib/format";

export default function AbsensiMengajarBerhasilPage() {
  const router = useRouter();

  const dynamic = getDynamicDateTime();
  const formattedDateTime = `${dynamic.date} • ${dynamic.time}`;

  const handleSelesai = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("absensi_mengajar_photo");
    }
    router.push("/guru");
  };

  return (
    <div className="flex flex-col items-center min-h-full bg-[#EEF2F7] px-6 pt-3 pb-10">
      <div className="w-12 h-12 bg-[#16a34a] rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-5 mt-30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13L9 17L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-[28px] font-bold text-slate-900 leading-tight text-center mb-3">
        Absensi Mengajar
        <br />
        Berhasil
      </h1>

      <p className="text-slate-500 text-sm text-center mb-8">
        Data absensi mengajar Anda sudah tersimpan.
      </p>

      <div className="w-full max-w-[320px] bg-white border border-slate-200 rounded-[20px] shadow-sm p-6 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs sm:text-sm text-slate-700 font-medium">
          {formattedDateTime}
        </p>
        <div className="bg-[#dcfce7] text-[#16a34a] text-xs font-bold px-6 py-1.5 rounded-full tracking-widest">
          TERSIMPAN
        </div>
      </div>

      <div className="w-full max-w-[354px] mt-30">
        <Button onClick={handleSelesai}>Selesai</Button>
      </div>
    </div>
  );
}

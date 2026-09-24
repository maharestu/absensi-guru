"use client";

import { useRouter } from "next/navigation";
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

const menuItems = [
  {
    id: "kehadiran",
    href: "/guru/pilih-status",
    title: "Absensi Kehadiran",
    description: "Catat kehadiran Anda untuk hari ini.",
    tag: "Kehadiran harian",
    tagColor: "text-green-600 bg-green-50",
    iconBg: "bg-green-50",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 13L9 17L19 7"
          stroke="#22c55e"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "mengajar",
    href: "/guru/presensi-mengajar",
    title: "Absensi Mengajar",
    description: "Catat aktivitas mengajar sesuai jadwal kelas.",
    tag: "Jadwal mengajar",
    tagColor: "text-blue-600 bg-blue-50",
    iconBg: "bg-blue-50",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6h16M4 10h16M4 14h10"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function DashboardGuruPage() {
  const router = useRouter();
  const { user } = useAuth();

  const today = formatTanggal(new Date());
  const namaGuru = user?.nama ?? "Nama Guru";
  const nipGuru = user?.username ?? "-";

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-14 pb-10">

      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">
          Pilih Jenis Absensi
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Silakan pilih aktivitas absensi yang akan dilakukan.
        </p>
      </header>

      {/* ── Kartu Info Guru ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 mb-8">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          {/* Avatar — lingkaran penuh (rounded-full) */}
          <div className="w-12 h-12 rounded-full bg-[#e0e7ff] flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#2563eb" />
              <path
                d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
                fill="#2563eb"
              />
            </svg>
          </div>

          {/* Nama & NIP */}
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">{namaGuru}</p>
            <p className="text-xs text-slate-400 mt-0.5">NIP {nipGuru}</p>
          </div>
        </div>

        {/* Tanggal */}
        <p className="text-xs text-slate-500 pt-3">{today}</p>
      </div>

      {/* ── Menu Absensi ── */}
      <p className="text-sm font-bold text-slate-900 mb-4">Pilih Absensi</p>

      <div className="flex flex-col gap-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-start gap-4 active:scale-[0.98] hover:shadow-md transition-all duration-150 text-left"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              {item.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {item.description}
              </p>
              <span
                className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${item.tagColor}`}
              >
                {item.tag}
              </span>
            </div>

            <div className="flex-shrink-0 self-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* ── Tombol Dev Reset (untuk Testing) ── */}
      <div className="mt-auto pt-8 flex justify-center">
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("absensi_completed");
              sessionStorage.removeItem("absensi_status");
              sessionStorage.removeItem("absensi_time");
              sessionStorage.removeItem("absensi_date");
              alert("Status absensi telah di-reset! Anda dapat mencoba alur absensi dari awal lagi.");
            }
          }}
          className="text-xs text-slate-400 hover:text-blue-600 underline font-medium transition-colors"
        >
          Reset Status Absensi (Dev Testing)
        </button>
      </div>
    </div>
  );
}

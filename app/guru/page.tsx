"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatTanggalLengkap } from "@/lib/format";
import { getDevTestingConfigClient } from "@/lib/testing-mode";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import {
  getStatusOperasionalHariIni,
  StatusOperasionalHariIni,
} from "@/actions/pengaturan";

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
  {
    id: "pulang",
    href: "/guru/presensi-pulang",
    title: "Absensi Pulang",
    description: "Catat waktu kepulangan Anda setelah jam sekolah.",
    tag: "Kepulangan harian",
    tagColor: "text-amber-600 bg-amber-50",
    iconBg: "bg-amber-50",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          stroke="#d97706"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function DashboardGuruPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isTestActive, setIsTestActive] = useState(false);
  // Inisialisasi sinkron dari cache session untuk menghilangkan flicker saat refresh
  const [statusOperasional, setStatusOperasional] = useState<StatusOperasionalHariIni | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
        const cached = sessionStorage.getItem(`op_cache_${todayStr}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    setIsTestActive(getDevTestingConfigClient().isActive);
    // Pre-warm halaman absensi agar navigasi guru instan & mulus tanpa jeda
    router.prefetch("/guru/pilih-status");
    router.prefetch("/guru/presensi-mengajar");
    router.prefetch("/guru/presensi-pulang");

    getStatusOperasionalHariIni()
      .then((res) => {
        setStatusOperasional(res);
        try {
          const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
          sessionStorage.setItem(`op_cache_${todayStr}`, JSON.stringify(res));
        } catch {}
      })
      .catch((err) => console.warn("getStatusOperasionalHariIni error:", err));
  }, [router]);

  const today = formatTanggalLengkap(new Date());
  const namaGuru = user?.nama ?? "Nama Guru";
  // Tampilkan NIP dari data guru (bukan username)
  const nipGuru = user?.nip ?? "-";

  const isBlocked = !isTestActive && Boolean(statusOperasional && !statusOperasional.isOperasional);
  const tipeLibur = statusOperasional?.tipeLibur;

  if (statusOperasional === null && !isTestActive) {
    return <FullScreenLoader bgClass="bg-[#EEF2F7]" />;
  }

  return (
    <div className="flex flex-col bg-[#EEF2F7] px-6 pt-3 pb-14 min-h-full animate-page-enter">

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
            <p className="text-xs text-slate-400 mt-0.5">NIP/NUPTK {nipGuru}</p>
          </div>
        </div>

        {/* Tanggal */}
        <p className="text-xs text-slate-500 pt-3">{today}</p>
      </div>

      {/* ── Banner Status Libur (Jika Libur Panjang atau Hari Libur Nasional) ── */}
      {isBlocked && (tipeLibur === "LIBUR_PANJANG" || tipeLibur === "HARI_LIBUR") && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 mb-6 shadow-xs flex items-start gap-3.5 animate-scale-up">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">
              {statusOperasional?.judul || "Sistem Absensi Sedang Libur"}
            </p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              {statusOperasional?.deskripsi}
              {statusOperasional?.periode && tipeLibur === "LIBUR_PANJANG" ? ` Periode: ${statusOperasional.periode}.` : ""}
            </p>
          </div>
        </div>
      )}

      {/* ── Menu Absensi ── */}
      <p className="text-sm font-bold text-slate-900 mb-4">Pilih Absensi</p>

      <div className="flex flex-col gap-4">
        {menuItems.map((item) => {
          let displayTitle = item.title;
          let displayDesc = item.description;
          let displayTag = item.tag;

          if (isBlocked) {
            if (tipeLibur === "LIBUR_PANJANG") {
              displayDesc = "Aktivitas absensi dinonaktifkan selama masa libur panjang.";
              displayTag = "Libur Panjang";
            } else if (tipeLibur === "HARI_LIBUR") {
              displayDesc = statusOperasional?.keterangan
                ? `Libur: ${statusOperasional.keterangan}. Absensi tidak aktif.`
                : "Aktivitas absensi tidak aktif pada hari libur sekolah.";
              displayTag = "Hari Libur";
            } else if (tipeLibur === "WEEKEND") {
              displayDesc = "Aktivitas absensi tidak aktif pada hari Sabtu & Minggu.";
              displayTag = "Libur Akhir Pekan";
            }
          }

          const displayTagColor = isBlocked
            ? "text-amber-700 bg-amber-50 border border-amber-200/60"
            : item.tagColor;

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-4 flex items-start gap-4 text-left transition-all duration-150 shadow-sm active:scale-[0.98] hover:shadow-md cursor-pointer touch-manipulation"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{displayTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {displayDesc}
                </p>
                <span
                  className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${displayTagColor}`}
                >
                  {displayTag}
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
          );
        })}
      </div>
    </div>
  );
}

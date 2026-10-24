"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import Button from "@/components/ui/button";

interface LiburPauseScreenProps {
  pageTitle: string;
  subtitle?: string;
  judul: string;
  deskripsi: string;
  periode?: string | null;
  keterangan?: string | null;
  backHref?: string;
}

export default function LiburPauseScreen({
  pageTitle,
  subtitle,
  judul,
  deskripsi,
  periode,
  keterangan,
  backHref = "/guru",
}: LiburPauseScreenProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full bg-[#EEF2F7] px-6 pt-3 pb-20 animate-page-enter">
      <PageHeader
        backHref={backHref}
        title={pageTitle}
        subtitle={subtitle || judul}
      />

      <div className="w-full bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col items-center justify-center p-8 text-center mt-6">
        {/* Glowing Amber Icon Container */}
        <div className="w-20 h-20 bg-gradient-to-b from-amber-50 to-amber-100/60 rounded-3xl flex items-center justify-center text-amber-600 mb-6 border border-amber-200/60 shadow-xs relative">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-3 right-3 animate-pulse" />
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M12 14v3" />
            <path d="M12 11h.01" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-[20px] font-bold text-slate-900 leading-tight mb-2">
          {judul}
        </h2>

        {/* Periode / Keterangan Tag */}
        {(periode || keterangan) && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold mb-3">
            <span>📅</span>
            <span>{periode ? `Periode: ${periode}` : keterangan}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-8">
          {deskripsi}
        </p>

        {/* Return Button */}
        <Button
          onClick={() => router.push(backHref)}
          className="w-full max-w-xs py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95"
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}

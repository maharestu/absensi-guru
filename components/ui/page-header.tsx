import React from "react";
import Link from "next/link";

interface PageHeaderProps {
  /** URL yang dituju tombol back */
  backHref: string;
  title: string;
  subtitle?: string;
}

/**
 * Header reusable untuk halaman guru:
 * - Tombol back (panah kiri) di kiri atas
 * - Judul bold besar
 * - Subtitle opsional
 */
export default function PageHeader({ backHref, title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        {/* Tombol Back */}
        <Link
          href={backHref}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          aria-label="Kembali"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19l-7-7 7-7"
              stroke="#1e293b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Judul */}
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight">
          {title}
        </h1>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-500 leading-relaxed pl-0.5">{subtitle}</p>
      )}
    </header>
  );
}

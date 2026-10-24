"use client";

import React, { useEffect } from "react";

export function PhotoOverlay({
  photoUrl,
  onClose,
}: {
  photoUrl: string | null;
  onClose: () => void;
}) {
  // Kunci scroll body saat overlay dibuka & dukung tombol Escape
  useEffect(() => {
    if (!photoUrl) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photoUrl, onClose]);

  if (!photoUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bukti Foto Presensi"
      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex flex-col justify-between items-center p-3 sm:p-5 h-[100dvh] w-full overflow-hidden animate-page-enter select-none"
      onClick={onClose}
    >
      {/* ── Top Bar (Selalu terlihat di dalam viewport, tidak terpotong) ── */}
      <div
        className="w-full max-w-2xl flex items-center justify-between py-1 px-1 sm:px-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide">
            Bukti Foto Presensi
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
          aria-label="Tutup foto"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* ── Area Preview Foto (Pas 100% Layar Mobile, Tanpa Scroll) ── */}
      <div
        className="flex-1 w-full max-w-2xl min-h-0 flex items-center justify-center p-1 sm:p-2 my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-full max-w-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
          <img
            src={photoUrl}
            alt="Bukti Foto Presensi"
            className="max-h-[calc(100dvh-130px)] sm:max-h-[calc(100dvh-120px)] max-w-full w-auto h-auto object-contain rounded-2xl"
          />
        </div>
      </div>

      {/* ── Bottom Bar Khusus Mobile (Tombol Tutup Mudah Dijangkau Jempol) ── */}
      <div
        className="w-full max-w-xs flex justify-center pt-1 pb-1 sm:hidden flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-6 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 text-white font-medium text-xs backdrop-blur-md border border-white/10 transition-all text-center cursor-pointer shadow-sm"
        >
          Tutup Foto
        </button>
      </div>
    </div>
  );
}

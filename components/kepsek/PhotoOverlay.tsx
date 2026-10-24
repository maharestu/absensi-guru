"use client";

import React, { useEffect } from "react";

export function PhotoOverlay({
  photoUrl,
  onClose,
}: {
  photoUrl: string | null;
  onClose: () => void;
}) {
  // Cegah scroll di latar belakang saat foto dibuka & dukung tombol Escape
  useEffect(() => {
    if (!photoUrl) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-page-enter select-none"
      onClick={onClose}
    >
      {/* Tombol Tutup (X) Melayang di Pojok Layar */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
        aria-label="Tutup"
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

      {/* Foto Utuh - Langsung pas dalam satu layar tanpa scroll */}
      <img
        src={photoUrl}
        alt="Bukti Absensi"
        className="rounded-2xl shadow-2xl object-contain max-h-[82dvh] max-w-[92vw] w-auto h-auto transition-transform"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

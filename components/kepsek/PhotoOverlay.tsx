"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function PhotoOverlay({
  photoUrl,
  onClose,
}: {
  photoUrl: string | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !photoUrl) return null;

  // Gunakan createPortal ke document.body agar tidak terjebak stacking context atau scroll container
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none overflow-hidden"
      onClick={onClose}
    >
      {/* Tombol Tutup (X) Melayang di Pojok Kanan Atas Layar */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
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

      {/* Foto - Digeser agak ke atas (-translate-y-5) agar pas di tengah atas pandangan mata */}
      <div
        className="w-full flex items-center justify-center -translate-y-5 sm:-translate-y-7"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photoUrl}
          alt="Bukti Absensi"
          className="rounded-2xl shadow-2xl object-contain max-h-[76dvh] max-w-[92vw] w-auto h-auto transition-transform"
        />
      </div>
    </div>,
    document.body
  );
}

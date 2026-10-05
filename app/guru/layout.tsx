import React from "react";
import Image from "next/image";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 */
export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-start items-center">
      {/* Wrapper Container */}
      <div className="w-full max-w-md min-h-screen bg-[#EEF2F7] relative flex flex-col">
        {/* Logo Sekolah — pojok kanan atas, fixed di atas konten */}
        <div className="absolute top-9 right-4 z-10">
          <Image
            src="/Logo.png"
            alt="Logo SMPN 8 Karawang Barat"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
        {children}
      </div>
    </div>
  );
}


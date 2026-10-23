"use client";

import React from "react";
import Image from "next/image";
import LogoutIconButton from "@/components/auth/logout-icon-button";

export default function GuruTopBar() {
  return (
    <header className="sticky top-0 w-full bg-white/95 backdrop-blur-sm px-5 py-3.5 flex items-center justify-between border-b border-slate-200 z-50 shadow-xs flex-shrink-0">
      <div className="flex items-center gap-3">
        <Image
          src="/Logo.png"
          alt="Logo SMPN 8 Karawang Barat"
          width={38}
          height={38}
          className="object-contain drop-shadow-sm"
          priority
        />
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight">
            SMPN 8 Karawang Barat
          </h1>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            Sistem Presensi Pendidik
          </p>
        </div>
      </div>
      <LogoutIconButton />
    </header>
  );
}

import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#EEF2F7] flex flex-col justify-between px-6 pt-10 sm:pt-8 pb-6">
      {/* Container Form Login (Tengah / Center) */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto sm:bg-white sm:p-10 sm:rounded-[32px] sm:shadow-sm sm:border sm:border-slate-200 animate-page-enter">
        {/* Logo Sekolah & Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Image
            src="/Logo.png"
            alt="Logo SMPN 8 Karawang Barat"
            width={96}
            height={96}
            className="object-contain drop-shadow-sm mb-4"
            priority
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            SMP Negeri 8 Karawang Barat
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Sistem Presensi Pendidik & Tenaga Kependidikan
          </p>
        </div>

        <Suspense fallback={<div className="py-12 text-center text-sm text-slate-400">Memuat formulir...</div>}>
          <LoginForm />
        </Suspense>

        {/* Bottom Bar / Footer (Khusus Mode Desktop: di dalam Card) */}
        <div className="hidden sm:block mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[12px] text-slate-500 font-medium">
            &copy; {currentYear} SMP Negeri 8 Karawang Barat. All rights reserved.
          </p>
          <p className="text-[11px] text-[#94a3b8] mt-1 font-medium">
            Karawang Barat, Jawa Barat &bull; TA {currentYear}/{currentYear + 1}
          </p>
        </div>
      </div>

      {/* Bottom Bar / Footer (Khusus Mode Mobile: di Paling Bawah Layar) */}
      <footer className="w-full text-center py-4 mt-auto sm:hidden">
        <div className="max-w-sm mx-auto pt-4 border-t border-slate-200/60">
          <p className="text-[12px] text-slate-500 font-medium">
            &copy; {currentYear} SMP Negeri 8 Karawang Barat. All rights reserved.
          </p>
          <p className="text-[11px] text-[#94a3b8] mt-1 font-medium">
            Karawang Barat, Jawa Barat &bull; TA {currentYear}/{currentYear + 1}
          </p>
        </div>
      </footer>
    </main>
  );
}


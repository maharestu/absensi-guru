import Image from "next/image";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#EEF2F7] flex flex-col justify-start sm:justify-center px-6 pt-14 sm:pt-8 pb-8">
      <div className="w-full max-w-sm sm:max-w-md mx-auto sm:bg-white sm:p-10 sm:rounded-[32px] sm:shadow-sm sm:border sm:border-slate-200">
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
        <LoginForm />

        {/* Footer / Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[12px] text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} SMP Negeri 8 Karawang Barat. All rights reserved.
          </p>
          <p className="text-[11px] text-[#94a3b8] mt-1.5 font-medium">
            Karawang Barat, Jawa Barat &bull; TA {new Date().getFullYear()}/{new Date().getFullYear() + 1}
          </p>
        </div>
      </div>
    </main>
  );
}

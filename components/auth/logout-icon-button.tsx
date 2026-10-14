"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutIconButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full active:scale-95 transition-all flex-shrink-0"
        title="Keluar"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Pop-up Konfirmasi */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[320px] shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[17px] font-bold text-slate-900 mb-2 text-center">Keluar dari Akun?</h3>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              Anda harus masuk kembali untuk menggunakan sistem absensi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold active:scale-[0.98] transition-all shadow-sm shadow-red-200"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

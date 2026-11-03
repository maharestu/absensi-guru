"use client";

import React, { useState, useEffect, useTransition } from "react";
import PageHeader from "@/components/ui/page-header";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import {
  getPengaturanGuruData,
  gantiPasswordGuruAction,
  PengaturanGuruData,
} from "@/actions/guru-pengaturan";

export default function PengaturanGuruPage() {
  const [data, setData] = useState<PengaturanGuruData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State Ganti Password
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");
    const res = await getPengaturanGuruData();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setErrorMessage(res.error || "Gagal memuat data profil guru.");
    }
    setLoading(false);
  }

  function handleGantiPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback({ type: null, message: "" });

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Seluruh kolom kata sandi wajib diisi.",
      });
      return;
    }

    if (passwordBaru.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "Kata sandi baru minimal harus 6 karakter.",
      });
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Konfirmasi kata sandi baru tidak cocok.",
      });
      return;
    }

    startTransition(async () => {
      const res = await gantiPasswordGuruAction({
        passwordLama,
        passwordBaru,
        konfirmasiPassword,
      });

      if (res.success) {
        setPasswordFeedback({
          type: "success",
          message: res.message || "Kata sandi Anda berhasil diperbarui.",
        });
        setPasswordLama("");
        setPasswordBaru("");
        setKonfirmasiPassword("");
      } else {
        setPasswordFeedback({
          type: "error",
          message: res.error || "Gagal memperbarui kata sandi.",
        });
      }
    });
  }

  if (loading) {
    return <FullScreenLoader message="Memuat informasi akun..." bgClass="bg-[#EEF2F7]" />;
  }

  const profil = data?.profil;

  return (
    <div className="flex flex-col bg-[#EEF2F7] px-6 pt-4 pb-16 min-h-full animate-page-enter">
      {/* ── Page Header ── */}
      <PageHeader
        title="Pengaturan Akun"
        subtitle="Kelola kata sandi akun guru Anda"
        backHref="/guru"
      />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs mb-6">
          {errorMessage}
        </div>
      )}

      {/* ── Card Informasi Profil Guru ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-[#e0e7ff] flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg">
            {profil?.nama ? profil.nama.charAt(0).toUpperCase() : "G"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
              {profil?.nama}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              NIP: {profil?.nip}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Username</span>
            <span className="font-semibold text-slate-800">{profil?.username || "-"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Jabatan</span>
            <span className="font-semibold text-slate-800 truncate block">
              {profil?.jabatan || "Guru Pengajar"}
            </span>
          </div>
        </div>
      </div>

      {/* ── FORMULIR GANTI PASSWORD ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Ubah Kata Sandi
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Perbarui kata sandi akun Anda secara berkala demi keamanan data.
        </p>

        {passwordFeedback.type && (
          <div
            className={`p-3 rounded-xl text-xs mb-4 border ${passwordFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
          >
            {passwordFeedback.message}
          </div>
        )}

        <form onSubmit={handleGantiPassword} className="space-y-4">
          {/* Password Lama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                type={showPasswordLama ? "text" : "password"}
                value={passwordLama}
                onChange={(e) => setPasswordLama(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordLama(!showPasswordLama)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showPasswordLama ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-label={showPasswordLama ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPasswordLama ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPasswordBaru ? "text" : "password"}
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordBaru(!showPasswordBaru)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showPasswordBaru ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-label={showPasswordBaru ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPasswordBaru ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showKonfirmasi ? "text" : "password"}
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showKonfirmasi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-label={showKonfirmasi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showKonfirmasi ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              "Simpan Kata Sandi"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

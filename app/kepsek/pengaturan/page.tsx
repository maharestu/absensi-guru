"use client";

import React, { useState, useEffect, useTransition } from "react";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
} from "lucide-react";
import {
  getProfilKepsekData,
  gantiPasswordKepsekAction,
  ProfilKepsekData,
} from "@/actions/kepsek-pengaturan";

export default function PengaturanKepsekPage() {
  const { timeString, dateString } = useRealtimeClock();
  const [profil, setProfil] = useState<ProfilKepsekData | null>(null);
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
    async function loadProfil() {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await getProfilKepsekData();
        if (res.success && res.data) {
          setProfil(res.data);
        } else {
          setErrorMessage(res.error || "Gagal memuat profil akun Kepala Sekolah.");
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Terjadi kesalahan saat memuat informasi profil.");
      } finally {
        setLoading(false);
      }
    }
    loadProfil();
  }, []);

  function handleGantiPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback({ type: null, message: "" });

    // Validasi Sisi Klien
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
        message: "Konfirmasi kata sandi baru tidak cocok dengan kata sandi baru.",
      });
      return;
    }

    startTransition(async () => {
      const res = await gantiPasswordKepsekAction({
        passwordLama,
        passwordBaru,
        konfirmasiPassword,
      });

      if (res.success) {
        setPasswordFeedback({
          type: "success",
          message: res.message || "Kata sandi akun Kepala Sekolah berhasil diperbarui.",
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
    return <FullScreenLoader message="Memuat informasi akun..." bgClass="bg-[#f8fafc]" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8 animate-page-enter">
      
      {/* ── HEADER ROW (Selaras dengan Dashboard & Laporan) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            Pengaturan Akun
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola kata sandi akun Kepala Sekolah Anda secara berkala.
          </p>

          {/* Realtime Clock & Date for Mobile (< sm) */}
          <div className="flex sm:hidden items-center gap-2 mt-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeString}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[200px]">{dateString}</span>
            </div>
          </div>
        </div>

        {/* Top Badges (Waktu & Tanggal Realtime) for Desktop (sm+) */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Jam Badge */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Clock className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>

          {/* Tanggal Badge */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <Calendar className="w-[18px] h-[18px] text-slate-700" strokeWidth={2} />
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200/90 text-rose-800 p-4 rounded-2xl text-xs md:text-sm flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* ── CARD INFORMASI AKUN ── */}
      {profil && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-2xs flex-shrink-0">
                {profil.nama ? profil.nama.charAt(0).toUpperCase() : "K"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {profil.nama}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Kepala Sekolah
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  NIP: {profil.nip || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs self-start sm:self-auto">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Username:</span>
              <span className="font-bold text-slate-800">{profil.username}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CARD FORMULIR GANTI PASSWORD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Ubah Kata Sandi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Perbarui kata sandi akun Anda secara berkala demi menjaga keamanan data sekolah.
          </p>
        </div>

        {/* Feedback Alert */}
        {passwordFeedback.type && (
          <div
            className={`p-4 rounded-xl text-xs md:text-sm mb-5 border flex items-start gap-3 transition-all ${
              passwordFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            {passwordFeedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <p className="font-medium">{passwordFeedback.message}</p>
          </div>
        )}

        <form onSubmit={handleGantiPassword} className="space-y-4 max-w-xl">
          {/* Kata Sandi Saat Ini */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                type={showPasswordLama ? "text" : "password"}
                value={passwordLama}
                onChange={(e) => setPasswordLama(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                className="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-11 text-slate-900 placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordLama(!showPasswordLama)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                title={showPasswordLama ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-label={showPasswordLama ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPasswordLama ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Kata Sandi Baru */}
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
                className="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-11 text-slate-900 placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordBaru(!showPasswordBaru)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                title={showPasswordBaru ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-label={showPasswordBaru ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPasswordBaru ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gunakan kombinasi huruf dan angka untuk keamanan lebih optimal.
            </p>
          </div>

          {/* Konfirmasi Kata Sandi Baru */}
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
                className="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-11 text-slate-900 placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                title={showKonfirmasi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-label={showKonfirmasi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showKonfirmasi ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs md:text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isPending ? "Menyimpan Perubahan..." : "Simpan Kata Sandi Baru"}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

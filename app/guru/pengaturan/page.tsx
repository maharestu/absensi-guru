"use client";

import React, { useState, useEffect, useTransition } from "react";
import PageHeader from "@/components/ui/page-header";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import { formatTanggalLengkap } from "@/lib/format";
import {
  getPengaturanGuruData,
  gantiPasswordGuruAction,
  PengaturanGuruData,
} from "@/actions/guru-pengaturan";

type ActiveTab = "kehadiran" | "mengajar" | "keamanan";

export default function PengaturanGuruPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("kehadiran");
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
      setErrorMessage(res.error || "Gagal memuat data pengaturan guru.");
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
  const stat = data?.kehadiranStatistik;
  const riwayat = data?.riwayatKehadiran || [];
  const jadwal = data?.jadwalMengajar || [];

  return (
    <div className="flex flex-col bg-[#EEF2F7] px-6 pt-4 pb-16 min-h-full animate-page-enter">
      {/* ── Page Header ── */}
      <PageHeader
        title="Pengaturan Guru"
        subtitle="Kelola profil, riwayat kehadiran, dan jadwal mengajar Anda"
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

      {/* ── Tab Navigasi Segmented Control ── */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl mb-6 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("kehadiran")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
            activeTab === "kehadiran"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Kehadiran
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mengajar")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
            activeTab === "mengajar"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Jadwal KBM
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("keamanan")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
            activeTab === "keamanan"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Ganti Password
        </button>
      </div>

      {/* ── TAB 1: KEHADIRAN ── */}
      {activeTab === "kehadiran" && (
        <div className="space-y-6 animate-fade-in">
          {/* Ringkasan Statistik Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Ringkasan Kehadiran
            </h3>

            <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 mb-4">
              <div>
                <p className="text-xs text-blue-700 font-medium">Persentase Kehadiran</p>
                <p className="text-2xl font-bold text-blue-900 mt-0.5">
                  {stat?.persentaseHadir ?? 0}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-900">
                  {stat?.totalHadir ?? 0} dari {stat?.totalHariTercatat ?? 0} Hari
                </p>
                <p className="text-[11px] text-blue-600/80 mt-0.5">
                  Tercatat Masuk Kerja
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                <span className="block text-[11px] text-emerald-700 font-medium">Hadir</span>
                <span className="text-base font-bold text-emerald-800">{stat?.totalHadir ?? 0}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                <span className="block text-[11px] text-amber-700 font-medium">Izin</span>
                <span className="text-base font-bold text-amber-800">{stat?.totalIzin ?? 0}</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                <span className="block text-[11px] text-rose-700 font-medium">Sakit</span>
                <span className="text-base font-bold text-rose-800">{stat?.totalSakit ?? 0}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
                <span className="block text-[11px] text-blue-700 font-medium">Dinas Luar</span>
                <span className="text-base font-bold text-blue-800">{stat?.totalDinas ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Riwayat Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Riwayat Kehadiran Terakhir
            </h3>

            {riwayat.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada data kehadiran tercatat.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {riwayat.map((item) => {
                  const statusLower = (item.status || "").toLowerCase();
                  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                  let label = item.status;

                  if (statusLower === "hadir") {
                    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    label = "Hadir";
                  } else if (statusLower === "izin") {
                    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                    label = "Izin";
                  } else if (statusLower === "sakit") {
                    badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                    label = "Sakit";
                  } else if (statusLower === "dinas") {
                    badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                    label = "Dinas Luar";
                  } else if (statusLower === "tidak_hadir") {
                    badgeClass = "bg-red-50 text-red-700 border-red-200";
                    label = "Tidak Hadir";
                  }

                  let jamMasukDisplay = "-";
                  if (item.waktu_submit && item.waktu_submit !== "-") {
                    try {
                      const dt = new Date(item.waktu_submit);
                      jamMasukDisplay = dt.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      });
                    } catch {
                      jamMasukDisplay = "-";
                    }
                  }

                  let jamPulangDisplay = "-";
                  if (item.waktu_pulang) {
                    try {
                      const dt = new Date(item.waktu_pulang);
                      jamPulangDisplay = dt.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      });
                    } catch {
                      jamPulangDisplay = "-";
                    }
                  }

                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {formatTanggalLengkap(new Date(item.tanggal))}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Masuk: <span className="font-medium text-slate-600">{jamMasukDisplay}</span>
                          {item.waktu_pulang && (
                            <> • Pulang: <span className="font-medium text-slate-600">{jamPulangDisplay}</span></>
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeClass}`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: JADWAL KBM ── */}
      {activeTab === "mengajar" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-fade-in">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Jadwal Mengajar Anda
          </h3>

          {jadwal.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Belum ada jadwal mengajar aktif yang terdaftar untuk Anda.
            </p>
          ) : (
            <div className="space-y-3">
              {jadwal.map((j) => (
                <div
                  key={j.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {j.hari}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                      {j.nama_kelas}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-800 leading-snug">
                    {j.mata_pelajaran}
                  </p>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{j.jam_mulai} – {j.jam_selesai} WIB</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: GANTI PASSWORD ── */}
      {activeTab === "keamanan" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Ubah Kata Sandi
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Perbarui kata sandi akun Anda secara berkala demi keamanan data.
          </p>

          {passwordFeedback.type && (
            <div
              className={`p-3 rounded-xl text-xs mb-4 border ${
                passwordFeedback.type === "success"
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
      )}
    </div>
  );
}

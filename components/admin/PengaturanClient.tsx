"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  upsertPengaturanSistem,
  updateLokasiSekolah,
  tambahHariLibur,
  hapusHariLibur,
  getHariLibur,
  updateLiburPanjang,
  type PengaturanSistem,
  type HariLibur,
} from "@/actions/pengaturan";
import { ClockBadges } from "./ui/ClockBadges";

// ── Tipe Props ────────────────────────────────────────────────

interface Props {
  pengaturanSistem: PengaturanSistem;
  hariLibur: HariLibur[];
  lokasiSekolah: { latitude: number; longitude: number; radius_meter: number };
}

type Tab = "waktu" | "libur" | "libur_panjang" | "lokasi";

// ── Helper ────────────────────────────────────────────────────

function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-").map(Number);
  const bulan = [
    "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${d} ${bulan[m]} ${y}`;
}

// ── Komponen Utama ────────────────────────────────────────────

export default function PengaturanClient({ pengaturanSistem, hariLibur, lokasiSekolah }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("waktu");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "waktu",
      label: "Waktu & Toleransi",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: "libur",
      label: "Hari Libur",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="9" y1="16" x2="15" y2="16" />
        </svg>
      ),
    },
    {
      id: "libur_panjang",
      label: "Libur Panjang (Shutdown)",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="10" y1="15" x2="10" y2="9" />
          <line x1="14" y1="15" x2="14" y2="9" />
        </svg>
      ),
    },
    {
      id: "lokasi",
      label: "Lokasi Sekolah",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Header Halaman (Seragam dengan Data Guru, Jadwal, Kelas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi waktu absensi, hari libur, shutdown, dan lokasi sekolah.
          </p>
        </div>
        <ClockBadges />
      </div>

      {/* Navigasi Tab Bar Responsif & Swipeable di HP */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-slate-100/90 rounded-2xl w-full sm:w-fit border border-slate-200/60 shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 min-h-[42px] ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Konten Tab Aktif */}
      {activeTab === "waktu" && <WaktuTab initialData={pengaturanSistem} />}
      {activeTab === "libur" && <LiburTab initialData={hariLibur} />}
      {activeTab === "libur_panjang" && <LiburPanjangTab initialData={pengaturanSistem} />}
      {activeTab === "lokasi" && <LokasiTab initialData={lokasiSekolah} />}
    </div>
  );
}

// ── Tab: Waktu & Toleransi ─────────────────────────────────────

function WaktuTab({ initialData }: { initialData: PengaturanSistem }) {
  const [jamMasuk, setJamMasuk] = useState(initialData.jam_masuk);
  const [jamCutoff, setJamCutoff] = useState(initialData.jam_cutoff);
  const [toleransi, setToleransi] = useState(String(initialData.toleransi_menit));
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setStatus(null);
    const tol = parseInt(toleransi, 10);
    if (isNaN(tol) || tol < 0 || tol > 120) {
      setStatus({ type: "error", msg: "Toleransi harus antara 0 hingga 120 menit." });
      return;
    }
    if (!jamMasuk || !jamCutoff) {
      setStatus({ type: "error", msg: "Jam masuk dan jam cutoff wajib diisi." });
      return;
    }
    if (jamCutoff <= jamMasuk) {
      setStatus({ type: "error", msg: "Jam cutoff harus setelah jam masuk." });
      return;
    }
    startTransition(async () => {
      const result = await upsertPengaturanSistem(jamMasuk, jamCutoff, tol);
      if (result.success) {
        setStatus({ type: "success", msg: "Pengaturan waktu berhasil disimpan." });
      } else {
        setStatus({ type: "error", msg: result.error ?? "Gagal menyimpan pengaturan." });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Waktu Absensi &amp; Toleransi</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Atur jadwal jam masuk sekolah, batas akhir absen pagi (cutoff), serta toleransi keterlambatan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Jam Masuk Sekolah
          </label>
          <input
            type="time"
            value={jamMasuk}
            onChange={(e) => setJamMasuk(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
          />
          <p className="mt-1.5 text-xs text-slate-400">Batas waktu absensi dianggap tepat waktu.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Batas Cutoff Absensi
          </label>
          <input
            type="time"
            value={jamCutoff}
            onChange={(e) => setJamCutoff(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
          />
          <p className="mt-1.5 text-xs text-slate-400">Setelah jam ini, guru yang belum absen dicatat Tidak Hadir.</p>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Toleransi Keterlambatan
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={120}
              value={toleransi}
              onChange={(e) => setToleransi(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
            />
            <span className="text-sm font-semibold text-slate-600 px-3.5 py-2.5 bg-slate-100 rounded-xl whitespace-nowrap">
              Menit
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Rentang waktu setelah jam masuk yang masih dihitung tepat waktu.</p>
        </div>
      </div>

      {status && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          status.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {status.msg}
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer min-h-[44px]"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Pengaturan Waktu</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Tab: Hari Libur ────────────────────────────────────────────

function LiburTab({ initialData }: { initialData: HariLibur[] }) {
  const [list, setList] = useState<HariLibur[]>(initialData);
  const [newTanggal, setNewTanggal] = useState("");
  const [newKeterangan, setNewKeterangan] = useState("");
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sinkronisasi data saat props berubah
  useEffect(() => {
    setList(initialData);
  }, [initialData]);

  // Ambil data libur terkini langsung dari server saat tab dimount
  useEffect(() => {
    getHariLibur().then((res) => {
      if (res && res.length > 0) {
        setList(res);
      }
    });
  }, []);

  const handleTambah = () => {
    setFormStatus(null);
    if (!newTanggal || !newKeterangan.trim()) {
      setFormStatus({ type: "error", msg: "Tanggal dan keterangan wajib diisi." });
      return;
    }
    startTransition(async () => {
      const result = await tambahHariLibur(newTanggal, newKeterangan);
      if (result.success) {
        const fresh = await getHariLibur();
        setList(fresh);
        setNewTanggal("");
        setNewKeterangan("");
        setFormStatus({ type: "success", msg: "Hari libur berhasil ditambahkan." });
      } else {
        setFormStatus({ type: "error", msg: result.error ?? "Gagal menambahkan hari libur." });
      }
    });
  };

  const handleHapus = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await hapusHariLibur(id);
      if (result.success) {
        const fresh = await getHariLibur();
        setList(fresh);
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Hari Libur Sekolah &amp; Nasional</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Guru tidak dapat absen di tanggal ini dan tidak akan dicatat Tidak Hadir pada laporan Kepsek.
          </p>
        </div>
        <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">
          {list.length} Hari Terdaftar
        </span>
      </div>

      {/* Form Tambah Hari Libur Responsif */}
      <div className="p-5 sm:p-7 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Tambah Hari Libur Baru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input
              type="date"
              value={newTanggal}
              onChange={(e) => setNewTanggal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Keterangan</label>
            <input
              type="text"
              placeholder="cth: Libur Awal Ramadhan / Acara Khusus Sekolah"
              value={newKeterangan}
              onChange={(e) => setNewKeterangan(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTambah()}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={handleTambah}
            disabled={isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer min-h-[42px]"
          >
            {isPending && !deletingId ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            )}
            <span>Tambah</span>
          </button>
        </div>

        {formStatus && (
          <div className={`mt-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
            formStatus.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : formStatus.type === "info"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {formStatus.msg}
          </div>
        )}
      </div>

      {/* Daftar Hari Libur Terdaftar */}
      <div className="p-5 sm:p-7">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Kalender Hari Libur
        </h3>
        {list.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl p-6">
            <svg className="mx-auto mb-3 opacity-40 text-slate-400" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="text-sm font-semibold text-slate-600">Belum ada hari libur yang ditambahkan.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan formulir di atas untuk mencatat libur sekolah atau hari besar nasional.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {list.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 font-bold text-xs">
                    📅
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.keterangan}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{formatTanggalIndo(item.tanggal)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleHapus(item.id)}
                  disabled={isPending && deletingId === item.id}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  title="Hapus hari libur ini"
                >
                  {isPending && deletingId === item.id ? (
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin block" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Mode Libur Panjang (Shutdown Absensi) ────────────────

function LiburPanjangTab({ initialData }: { initialData: PengaturanSistem }) {
  const [aktif, setAktif] = useState(initialData.libur_panjang_aktif ?? false);
  const [mulai, setMulai] = useState(initialData.libur_panjang_mulai ?? "");
  const [selesai, setSelesai] = useState(initialData.libur_panjang_selesai ?? "");
  const [keterangan, setKeterangan] = useState(initialData.libur_panjang_keterangan ?? "");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setStatus(null);
    if (aktif && mulai && selesai && selesai < mulai) {
      setStatus({ type: "error", msg: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai." });
      return;
    }

    startTransition(async () => {
      const result = await updateLiburPanjang(aktif, mulai, selesai, keterangan);
      if (result.success) {
        setStatus({
          type: "success",
          msg: aktif
            ? (mulai && selesai
                ? `Mode Libur Panjang berhasil diaktifkan untuk periode ${mulai} s.d. ${selesai}.`
                : "Mode Libur Panjang berhasil diaktifkan. Seluruh aktivitas absensi dinonaktifkan.")
            : "Mode Libur Panjang telah dinonaktifkan. Sistem absensi beroperasi normal.",
        });
      } else {
        setStatus({ type: "error", msg: result.error ?? "Gagal menyimpan konfigurasi libur panjang." });
      }
    });
  };

  const setPresetLiburAkhirTahun = () => {
    const curYear = new Date().getFullYear();
    setMulai(`${curYear}-12-22`);
    setSelesai(`${curYear + 1}-01-03`);
    setKeterangan(`Libur Semester Ganjil & Akhir Tahun ${curYear}`);
    setAktif(true);
  };

  const setPresetHariIni = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setMulai(todayStr);
    setSelesai(todayStr);
    setKeterangan("Libur khusus sekolah");
    setAktif(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Mode Libur Panjang (Shutdown Absensi)</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
              aktif
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-slate-100 text-slate-600"
            }`}>
              <span className={`w-2 h-2 rounded-full ${aktif ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`} />
              {aktif ? "SEDANG AKTIF" : "NONAKTIF"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Gunakan fitur ini untuk menonaktifkan seluruh aktivitas absensi saat libur panjang (seperti libur semester atau akhir tahun).
          </p>
        </div>
      </div>

      {/* Switch Toggle */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        aktif ? "bg-amber-50/70 border-amber-200 shadow-sm" : "bg-slate-50/80 border-slate-200"
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              {aktif ? "Status: Mode Libur Panjang Aktif" : "Status: Mode Libur Panjang Nonaktif"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {aktif
                ? "Sistem absensi akan mengunci semua tombol presensi masuk & mengajar pada rentang tanggal di bawah."
                : "Sistem absensi berjalan normal mengikuti jam sekolah dan kalender kerja."}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 select-none">
            <input
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
          </label>
        </div>
      </div>

      {/* Form Rentang Waktu Libur Panjang */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Tanggal Mulai Libur
            </label>
            <input
              type="date"
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Tanggal Selesai Libur
            </label>
            <input
              type="date"
              value={selesai}
              onChange={(e) => setSelesai(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Keterangan / Pengumuman untuk Guru (Opsional)
          </label>
          <input
            type="text"
            placeholder="cth: Libur Semester Ganjil & Tahun Baru"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Teks ini akan ditampilkan di banner informasi halaman guru selama libur panjang berlangsung.
          </p>
        </div>

        {/* Preset Cepat */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preset Cepat:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={setPresetHariIni}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <span>⚡</span>
              <span>Matikan Langsung Hari Ini</span>
            </button>
            <button
              type="button"
              onClick={setPresetLiburAkhirTahun}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <span>🗓</span>
              <span>Set Libur Akhir Tahun (22 Des – 3 Jan)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Dampak Sistem */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Dampak Saat Mode Ini Aktif:
        </p>
        <ul className="text-xs sm:text-sm text-slate-600 space-y-2">
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span><strong>Absensi Guru Dialihkan:</strong> Guru yang menekan tombol presensi akan melihat layar informasi libur dan tidak dapat mengirim presensi.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span><strong>Laporan Kepsek Bersih:</strong> Rekonsiliasi absensi Kepsek tidak akan menandai guru sebagai &quot;Tidak Hadir&quot; (status libur panjang).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span><strong>Banner Informasi:</strong> Dashboard guru &amp; kepsek menampilkan pemberitahuan tanggal aktif kembali.</span>
          </li>
        </ul>
      </div>

      {status && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          status.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {status.msg}
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer min-h-[44px]"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Pengaturan Libur Panjang</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Tab: Lokasi Sekolah ────────────────────────────────────────

function LokasiTab({ initialData }: { initialData: { latitude: number; longitude: number; radius_meter: number } }) {
  const [lat, setLat] = useState(String(initialData.latitude));
  const [lng, setLng] = useState(String(initialData.longitude));
  const [radius, setRadius] = useState(String(initialData.radius_meter));
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLocating, setIsLocating] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus({ type: "error", msg: "Browser Anda tidak mendukung deteksi lokasi (Geolocation)." });
      return;
    }
    setIsLocating(true);
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = pos.coords.latitude.toFixed(6);
        const userLng = pos.coords.longitude.toFixed(6);
        setLat(userLat);
        setLng(userLng);
        setStatus({
          type: "success",
          msg: `Koordinat GPS berhasil diambil (${userLat}, ${userLng}). Jangan lupa klik 'Simpan Lokasi'.`,
        });
      },
      (err) => {
        setIsLocating(false);
        let errorMsg = "Gagal mengambil lokasi GPS.";
        if (err.code === 1) errorMsg = "Izin akses lokasi ditolak oleh browser/perangkat.";
        else if (err.code === 2) errorMsg = "Posisi GPS tidak ditemukan. Pastikan GPS HP aktif.";
        else if (err.code === 3) errorMsg = "Permintaan deteksi lokasi timeout.";
        setStatus({ type: "error", msg: errorMsg });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    setStatus(null);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseInt(radius, 10);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setStatus({ type: "error", msg: "Latitude tidak valid (−90 hingga 90)." });
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setStatus({ type: "error", msg: "Longitude tidak valid (−180 hingga 180)." });
      return;
    }
    if (isNaN(radiusNum) || radiusNum < 0) {
      setStatus({ type: "error", msg: "Radius harus berupa angka yang valid (minimal 0 meter)." });
      return;
    }

    startTransition(async () => {
      const result = await updateLokasiSekolah(latNum, lngNum, radiusNum);
      if (result.success) {
        setStatus({ type: "success", msg: "Lokasi sekolah berhasil diperbarui." });
      } else {
        setStatus({ type: "error", msg: result.error ?? "Gagal menyimpan lokasi." });
      }
    });
  };

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-7 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Lokasi &amp; Geofencing Sekolah</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tentukan titik koordinat pusat sekolah dan radius toleransi presensi guru.
        </p>
      </div>

      {/* Fitur Ambil Titik GPS Langsung (Sangat Praktis di Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
        <div>
          <p className="text-sm font-bold text-slate-800">Deteksi Otomatis via GPS</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Berada di lokasi sekolah sekarang? Ambil titik koordinat terkini langsung dari sensor GPS perangkat.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
        >
          {isLocating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Mendeteksi Lokasi...</span>
            </>
          ) : (
            <>
              <span>📍</span>
              <span>Ambil Koordinat Saya Saat Ini</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Radius Geofencing</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-transparent transition-all"
            />
            <span className="text-sm font-semibold text-slate-600 px-3.5 py-2.5 bg-slate-100 rounded-xl whitespace-nowrap">
              Meter
            </span>
          </div>
        </div>
      </div>

      {status && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          status.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {status.msg}
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer min-h-[44px]"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Lokasi</span>
          )}
        </button>

        {parseFloat(lat) !== 0 && parseFloat(lng) !== 0 && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all min-h-[44px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Lihat di Google Maps</span>
          </a>
        )}
      </div>
    </div>
  );
}

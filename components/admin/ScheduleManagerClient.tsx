"use client";

import React, { useState, useEffect } from "react";
import { MOCK_ADMIN_JADWAL_LIST, MOCK_GURU_LIST } from "@/lib/mock-data";
import type { AdminJadwalItem } from "@/types/admin";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";

const STORAGE_KEY = "admin_jadwal_list";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const KELAS_OPTIONS = ["VII A", "VII B", "VII C", "VII D", "VIII A", "VIII B", "VIII C", "VIII D", "IX A", "IX B", "IX C", "IX D", "X RPL 1", "X RPL 2"];
const MATPEL_OPTIONS = ["Matematika", "Bahasa Indonesia", "Seni Budaya", "IPA", "IPS", "Olahraga", "Kimia", "Fisika", "Biologi", "Bahasa Inggris", "Pendidikan Agama"];

export default function ScheduleManagerClient() {
  const [schedules, setSchedules] = useState<AdminJadwalItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // View state: "list" | "create"
  const [viewMode, setViewMode] = useState<"list" | "create">("list");

  // Modal states
  const [editingSchedule, setEditingSchedule] = useState<AdminJadwalItem | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<AdminJadwalItem | null>(null);

  // Form state for Create Schedule
  const [createForm, setCreateForm] = useState({
    hari: "",
    kelas: "",
    jam_mulai: "07.00",
    jam_selesai: "08.30",
    mata_pelajaran: "",
    guru: "",
  });

  // Form state for Edit Schedule
  const [editForm, setEditForm] = useState({
    hari: "Senin",
    kelas: "VII A",
    jam_mulai: "07.00",
    jam_selesai: "08.30",
    mata_pelajaran: "Matematika",
    guru: "Ahmad Fauzan S.Pd.",
  });

  // Realtime clock & date
  const { timeString, dateString } = useRealtimeClock();

  // Load schedules from localStorage or fallback to MOCK_ADMIN_JADWAL_LIST
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSchedules(JSON.parse(stored));
        } catch (e) {
          console.error("Gagal parse local storage jadwal:", e);
          setSchedules(MOCK_ADMIN_JADWAL_LIST);
        }
      } else {
        setSchedules(MOCK_ADMIN_JADWAL_LIST);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ADMIN_JADWAL_LIST));
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  const saveSchedulesToStorage = (updatedList: AdminJadwalItem[]) => {
    setSchedules(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    }
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.mata_pelajaran.toLowerCase().includes(q) ||
      s.guru.toLowerCase().includes(q) ||
      s.kelas.toLowerCase().includes(q) ||
      s.hari.toLowerCase().includes(q)
    );
  });

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!deletingSchedule) return;
    const updated = schedules.filter((s) => s.id !== deletingSchedule.id);
    saveSchedulesToStorage(updated);
    setDeletingSchedule(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (jadwal: AdminJadwalItem) => {
    setEditingSchedule(jadwal);
    setEditForm({
      hari: jadwal.hari,
      kelas: jadwal.kelas,
      jam_mulai: jadwal.jam_mulai.replace(":", "."),
      jam_selesai: jadwal.jam_selesai.replace(":", "."),
      mata_pelajaran: jadwal.mata_pelajaran,
      guru: jadwal.guru,
    });
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    const updated = schedules.map((s) => {
      if (s.id === editingSchedule.id) {
        return {
          ...s,
          hari: editForm.hari,
          kelas: editForm.kelas,
          jam_mulai: editForm.jam_mulai.replace(".", ":"),
          jam_selesai: editForm.jam_selesai.replace(".", ":"),
          mata_pelajaran: editForm.mata_pelajaran,
          guru: editForm.guru,
        };
      }
      return s;
    });

    saveSchedulesToStorage(updated);
    setEditingSchedule(null);
  };

  // Handle Create Schedule Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.mata_pelajaran || !createForm.hari || !createForm.kelas) return;

    const newJadwal: AdminJadwalItem = {
      id: `jadwal-adm-${Date.now()}`,
      hari: createForm.hari,
      kelas: createForm.kelas,
      jam_mulai: createForm.jam_mulai.replace(".", ":"),
      jam_selesai: createForm.jam_selesai.replace(".", ":"),
      mata_pelajaran: createForm.mata_pelajaran,
      guru: createForm.guru || "Ahmad Fauzan S.Pd.",
    };

    const updated = [newJadwal, ...schedules];
    saveSchedulesToStorage(updated);

    // Reset form & back to list
    setCreateForm({
      hari: "",
      kelas: "",
      jam_mulai: "07.00",
      jam_selesai: "08.30",
      mata_pelajaran: "",
      guru: "",
    });
    setViewMode("list");
  };

  if (!isLoaded) {
    return <div className="min-h-[400px]" />;
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW: TAMBAH JADWAL (Gambar 4 Figma)
  // ═══════════════════════════════════════════════════════════
  if (viewMode === "create") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              Tambah Jadwal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Lengkapi data berikut, lalu tambah ke daftar jadwal.
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-semibold text-slate-700">{timeString}</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-semibold text-slate-700">{dateString}</span>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6">Informasi Jadwal</h2>

          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hari */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Hari
                </label>
                <div className="relative">
                  <select
                    value={createForm.hari}
                    onChange={(e) => setCreateForm({ ...createForm, hari: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih hari</option>
                    {HARI_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Kelas */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Kelas
                </label>
                <div className="relative">
                  <select
                    value={createForm.kelas}
                    onChange={(e) => setCreateForm({ ...createForm, kelas: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih kelas</option>
                    {KELAS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Jam Mulai */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Jam mulai
                </label>
                <input
                  type="text"
                  placeholder="07.00"
                  value={createForm.jam_mulai}
                  onChange={(e) => setCreateForm({ ...createForm, jam_mulai: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* Jam Selesai */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Jam selesai
                </label>
                <input
                  type="text"
                  placeholder="08.30"
                  value={createForm.jam_selesai}
                  onChange={(e) => setCreateForm({ ...createForm, jam_selesai: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* Mata Pelajaran */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Mata pelajaran
                </label>
                <div className="relative">
                  <select
                    value={createForm.mata_pelajaran}
                    onChange={(e) => setCreateForm({ ...createForm, mata_pelajaran: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih mata pelajaran</option>
                    {MATPEL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Guru Pengajar */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Guru pengajar
                </label>
                <div className="relative">
                  <select
                    value={createForm.guru}
                    onChange={(e) => setCreateForm({ ...createForm, guru: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih guru pengajar</option>
                    {MOCK_GURU_LIST.map((g) => (
                      <option key={g.id} value={g.nama}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all"
              >
                + Tambah Data
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW: DAFTAR JADWAL (Gambar 1 Figma)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Kelola Jadwal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tambah, lihat, dan perbarui data jadwal.
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-700">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>
        </div>
      </div>

      {/* Filter Row & Tombol Tambah */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[280px]">
          <input
            type="text"
            placeholder="Cari mata pelajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border border-transparent transition-all"
          />
        </div>

        <button
          onClick={() => setViewMode("create")}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <span>+</span>
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Tabel Data Jadwal */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              <th className="pb-4 font-semibold w-[15%]">HARI</th>
              <th className="pb-4 font-semibold w-[20%]">WAKTU</th>
              <th className="pb-4 font-semibold w-[22%]">MATA PELAJARAN</th>
              <th className="pb-4 font-semibold w-[15%]">KELAS</th>
              <th className="pb-4 font-semibold w-[20%]">GURU</th>
              <th className="pb-4 font-semibold text-right w-[8%]">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada data jadwal yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredSchedules.map((jadwal) => (
                <tr key={jadwal.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-bold text-slate-900">
                    {jadwal.hari}
                  </td>
                  <td className="py-4 text-slate-500 font-medium">
                    {jadwal.jam_mulai} – {jadwal.jam_selesai}
                  </td>
                  <td className="py-4 text-slate-800 font-medium">
                    {jadwal.mata_pelajaran}
                  </td>
                  <td className="py-4 text-slate-500 font-medium">
                    {jadwal.kelas}
                  </td>
                  <td className="py-4 text-slate-600 font-medium">
                    {jadwal.guru}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(jadwal)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Edit Jadwal"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingSchedule(jadwal)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus Jadwal"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: HAPUS JADWAL (Gambar 2 Figma)
         ═══════════════════════════════════════════════════════════ */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Red Alert Icon */}
            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <span className="text-2xl font-bold leading-none">!</span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-xl font-bold text-slate-900">Hapus Data?</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {/* Question */}
            <p className="text-sm font-semibold text-slate-700">
              Apakah Anda yakin ingin menghapus data yang dipilih?
            </p>

            {/* Selected Data Preview Box */}
            <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-xl">
              <p className="text-xs text-slate-400 font-medium">Data terpilih</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {deletingSchedule.hari} • {deletingSchedule.jam_mulai} - {deletingSchedule.jam_selesai} • {deletingSchedule.mata_pelajaran} • {deletingSchedule.kelas}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSchedule(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: UPDATE JADWAL (Gambar 3 Figma)
         ═══════════════════════════════════════════════════════════ */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Update Jadwal
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbarui waktu dan informasi jadwal mengajar.
              </p>
            </div>

            {/* Form Edit */}
            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Hari */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Hari
                  </label>
                  <input
                    type="text"
                    value={editForm.hari}
                    onChange={(e) => setEditForm({ ...editForm, hari: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                {/* Kelas */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={editForm.kelas}
                    onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                {/* Jam Mulai */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Jam mulai
                  </label>
                  <input
                    type="text"
                    value={editForm.jam_mulai}
                    onChange={(e) => setEditForm({ ...editForm, jam_mulai: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                {/* Jam Selesai */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Jam selesai
                  </label>
                  <input
                    type="text"
                    value={editForm.jam_selesai}
                    onChange={(e) => setEditForm({ ...editForm, jam_selesai: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                {/* Mata Pelajaran */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Mata pelajaran
                  </label>
                  <input
                    type="text"
                    value={editForm.mata_pelajaran}
                    onChange={(e) => setEditForm({ ...editForm, mata_pelajaran: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                {/* Guru Pengajar */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Guru pengajar
                  </label>
                  <input
                    type="text"
                    value={editForm.guru}
                    onChange={(e) => setEditForm({ ...editForm, guru: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

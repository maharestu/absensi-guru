"use client";

import React, { useState, useEffect } from "react";
import { getJadwalList, createJadwal, updateJadwal, deleteJadwal } from "@/actions/jadwal";
import { getGuruList } from "@/actions/guru";
import { getKelasList } from "@/actions/kelas";
import { Guru, Kelas, JadwalWithDetail, HariJadwal } from "@/types/schema";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Edit2, Trash2 } from "lucide-react";

const HARI_OPTIONS: { value: HariJadwal; label: string }[] = [
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
];

export default function ScheduleManagerClient() {
  const [schedules, setSchedules] = useState<JadwalWithDetail[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // View state: "list" | "create"
  const [viewMode, setViewMode] = useState<"list" | "create">("list");

  // Modal states
  const [editingSchedule, setEditingSchedule] = useState<JadwalWithDetail | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<JadwalWithDetail | null>(null);

  // Form state for Create Schedule
  const [createForm, setCreateForm] = useState({
    hari: "senin" as HariJadwal,
    kelas_id: "",
    guru_id: "",
    jam_mulai: "07:00",
    jam_selesai: "08:30",
    mata_pelajaran: "",
  });

  // Form state for Edit Schedule
  const [editForm, setEditForm] = useState({
    hari: "senin" as HariJadwal,
    kelas_id: "",
    guru_id: "",
    jam_mulai: "07:00",
    jam_selesai: "08:30",
    mata_pelajaran: "",
  });

  // Realtime clock & date
  const { timeString, dateString } = useRealtimeClock();

  const loadAllData = async () => {
    try {
      const [jData, gData, kData] = await Promise.all([
        getJadwalList(),
        getGuruList(),
        getKelasList(),
      ]);
      setSchedules(jData);
      setGuruList(gData);
      setKelasList(kData);
      if (kData.length > 0 && !createForm.kelas_id) {
        setCreateForm((prev) => ({ ...prev, kelas_id: kData[0].id }));
      }
      if (gData.length > 0 && !createForm.guru_id) {
        setCreateForm((prev) => ({ ...prev, guru_id: gData[0].id }));
      }
    } catch (e) {
      console.error("Gagal memuat data jadwal/guru/kelas:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matpel = (s.mata_pelajaran || "").toLowerCase();
    const guruNama = (s.guru?.nama || "").toLowerCase();
    const kelasNama = (s.kelas?.nama_kelas || "").toLowerCase();
    const hari = (s.hari || "").toLowerCase();

    return (
      matpel.includes(q) ||
      guruNama.includes(q) ||
      kelasNama.includes(q) ||
      hari.includes(q)
    );
  });

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;
    try {
      setSubmitting(true);
      await deleteJadwal(deletingSchedule.id);
      setSchedules((prev) => prev.filter((s) => s.id !== deletingSchedule.id));
      setDeletingSchedule(null);
    } catch (err: any) {
      alert("Gagal menghapus jadwal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (jadwal: JadwalWithDetail) => {
    setEditingSchedule(jadwal);
    setEditForm({
      hari: (jadwal.hari as HariJadwal) || "senin",
      kelas_id: jadwal.kelas_id,
      guru_id: jadwal.guru_id,
      jam_mulai: jadwal.jam_mulai.slice(0, 5),
      jam_selesai: jadwal.jam_selesai.slice(0, 5),
      mata_pelajaran: jadwal.mata_pelajaran,
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      setSubmitting(true);
      await updateJadwal(editingSchedule.id, {
        hari: editForm.hari,
        kelas_id: editForm.kelas_id,
        guru_id: editForm.guru_id,
        jam_mulai: editForm.jam_mulai,
        jam_selesai: editForm.jam_selesai,
        mata_pelajaran: editForm.mata_pelajaran,
      });

      await loadAllData();
      setEditingSchedule(null);
    } catch (err: any) {
      alert("Gagal mengupdate jadwal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Schedule Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.mata_pelajaran || !createForm.hari || !createForm.kelas_id || !createForm.guru_id) {
      alert("Mohon lengkapi seluruh formulir jadwal!");
      return;
    }

    try {
      setSubmitting(true);
      await createJadwal({
        hari: createForm.hari,
        kelas_id: createForm.kelas_id,
        guru_id: createForm.guru_id,
        jam_mulai: createForm.jam_mulai,
        jam_selesai: createForm.jam_selesai,
        mata_pelajaran: createForm.mata_pelajaran,
        status: "aktif",
      });

      await loadAllData();
      setCreateForm({
        hari: "senin",
        kelas_id: kelasList[0]?.id || "",
        guru_id: guruList[0]?.id || "",
        jam_mulai: "07:00",
        jam_selesai: "08:30",
        mata_pelajaran: "",
      });
      setViewMode("list");
    } catch (err: any) {
      alert("Gagal menambahkan jadwal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-[400px] flex items-center justify-center text-slate-400">Memuat data jadwal...</div>;
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW: TAMBAH JADWAL
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
              <span className="text-sm font-semibold text-slate-700">{timeString}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
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
                <label className="block text-xs font-semibold text-slate-800">Hari</label>
                <div className="relative">
                  <select
                    value={createForm.hari}
                    onChange={(e) => setCreateForm({ ...createForm, hari: e.target.value as HariJadwal })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    {HARI_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kelas */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Kelas</label>
                <div className="relative">
                  <select
                    value={createForm.kelas_id}
                    onChange={(e) => setCreateForm({ ...createForm, kelas_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih kelas</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jam Mulai */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Jam Mulai (HH:MM)</label>
                <input
                  type="text"
                  placeholder="07:00"
                  value={createForm.jam_mulai}
                  onChange={(e) => setCreateForm({ ...createForm, jam_mulai: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* Jam Selesai */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Jam Selesai (HH:MM)</label>
                <input
                  type="text"
                  placeholder="08:30"
                  value={createForm.jam_selesai}
                  onChange={(e) => setCreateForm({ ...createForm, jam_selesai: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* Mata Pelajaran */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Mata Pelajaran</label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika"
                  value={createForm.mata_pelajaran}
                  onChange={(e) => setCreateForm({ ...createForm, mata_pelajaran: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {/* Guru Pengajar */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Guru Pengajar</label>
                <div className="relative">
                  <select
                    value={createForm.guru_id}
                    onChange={(e) => setCreateForm({ ...createForm, guru_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih guru pengajar</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.nip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "+ Tambah Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW: DAFTAR JADWAL
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
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[280px]">
          <input
            type="text"
            placeholder="Cari mapel / guru / kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border border-transparent transition-all"
          />
        </div>

        <button
          onClick={() => setViewMode("create")}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>+</span>
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Table Data Jadwal */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              <th className="pb-4 font-semibold w-[12%]">HARI</th>
              <th className="pb-4 font-semibold w-[16%]">JAM</th>
              <th className="pb-4 font-semibold w-[22%]">MATA PELAJARAN</th>
              <th className="pb-4 font-semibold w-[18%]">KELAS</th>
              <th className="pb-4 font-semibold w-[22%]">GURU</th>
              <th className="pb-4 font-semibold text-right w-[10%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada jadwal yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredSchedules.map((jadwal) => (
                <tr key={jadwal.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-semibold text-slate-900 capitalize">
                    {jadwal.hari}
                  </td>
                  <td className="py-4 text-slate-500 font-medium">
                    {jadwal.jam_mulai.slice(0, 5)} - {jadwal.jam_selesai.slice(0, 5)}
                  </td>
                  <td className="py-4 font-semibold text-slate-800">
                    {jadwal.mata_pelajaran}
                  </td>
                  <td className="py-4 text-slate-600 font-medium">
                    {jadwal.kelas?.nama_kelas || "-"}
                  </td>
                  <td className="py-4 text-slate-600 font-medium">
                    {jadwal.guru?.nama || "-"}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleOpenEdit(jadwal)}
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1 cursor-pointer"
                        title="Edit Jadwal"
                      >
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={() => setDeletingSchedule(jadwal)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: HAPUS JADWAL */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Hapus Data Jadwal?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Apakah Anda yakin ingin menghapus jadwal ini?
            </p>
            <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-xl">
              <p className="text-sm font-bold text-slate-900">
                {deletingSchedule.mata_pelajaran} - {deletingSchedule.kelas?.nama_kelas}
              </p>
              <p className="text-xs text-slate-400 mt-1 capitalize">
                {deletingSchedule.hari} ({deletingSchedule.jam_mulai.slice(0, 5)} - {deletingSchedule.jam_selesai.slice(0, 5)})
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeletingSchedule(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? "Menghapus..." : "Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE JADWAL */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Update Jadwal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Perbarui waktu dan informasi jadwal mengajar.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Hari</label>
                  <select
                    value={editForm.hari}
                    onChange={(e) => setEditForm({ ...editForm, hari: e.target.value as HariJadwal })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  >
                    {HARI_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Kelas</label>
                  <select
                    value={editForm.kelas_id}
                    onChange={(e) => setEditForm({ ...editForm, kelas_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Jam Mulai</label>
                  <input
                    type="text"
                    value={editForm.jam_mulai}
                    onChange={(e) => setEditForm({ ...editForm, jam_mulai: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Jam Selesai</label>
                  <input
                    type="text"
                    value={editForm.jam_selesai}
                    onChange={(e) => setEditForm({ ...editForm, jam_selesai: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={editForm.mata_pelajaran}
                    onChange={(e) => setEditForm({ ...editForm, mata_pelajaran: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Guru Pengajar</label>
                  <select
                    value={editForm.guru_id}
                    onChange={(e) => setEditForm({ ...editForm, guru_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  >
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.nip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setEditingSchedule(null)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

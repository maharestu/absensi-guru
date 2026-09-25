"use client";

import React, { useState, useEffect } from "react";
import { Guru } from "@/types/schema";
import { getGuruList, createGuru, updateGuru, deleteGuru } from "@/actions/guru";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";

export default function TeacherManagerClient() {
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [editingTeacher, setEditingTeacher] = useState<Guru | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Guru | null>(null);

  const [createForm, setCreateForm] = useState({
    nama: "",
    nip: "",
    jabatan: "",
    no_telepon: "",
    alamat: "",
    status: "aktif" as "aktif" | "nonaktif",
    jenis_kelamin: "Laki-Laki",
  });

  const [editForm, setEditForm] = useState({
    nama: "",
    nip: "",
    jabatan: "",
    no_telepon: "",
    alamat: "",
    status: "aktif" as "aktif" | "nonaktif",
    jenis_kelamin: "Laki-Laki",
  });

  const loadTeachers = async () => {
    try {
      const data = await getGuruList();
      setTeachers(data);
    } catch (e) {
      console.error("Gagal mengambil data guru dari database:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.nama || "").toLowerCase().includes(q) ||
      (t.nip || "").toLowerCase().includes(q) ||
      (t.jabatan && t.jabatan.toLowerCase().includes(q))
    );
  });

  const handleConfirmDelete = async () => {
    if (!deletingTeacher) return;
    try {
      setSubmitting(true);
      const res = await deleteGuru(deletingTeacher.id);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => t.id !== deletingTeacher.id));
        setDeletingTeacher(null);
      } else {
        alert("Gagal menghapus guru: " + (res.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (guru: Guru) => {
    setEditingTeacher(guru);
    setEditForm({
      nama: guru.nama || "",
      nip: guru.nip || "",
      jabatan: guru.jabatan || "",
      no_telepon: guru.no_telepon || "",
      alamat: guru.alamat || "Jl. Pendidikan No. 10, Bandung",
      status: (guru.status?.toLowerCase() === "nonaktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",
      jenis_kelamin: (guru.jenis_kelamin as string) || "Laki-Laki",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      setSubmitting(true);
      const updateData = {
        nama: editForm.nama,
        nip: editForm.nip,
        jabatan: editForm.jabatan,
        no_telepon: editForm.no_telepon,
        alamat: editForm.alamat,
        status: editForm.status,
        jenis_kelamin: editForm.jenis_kelamin,
      };

      const res = await updateGuru(editingTeacher.id, updateData);
      if (res.success) {
        setTeachers((prev) =>
          prev.map((t) => (t.id === editingTeacher.id ? { ...t, ...updateData } : t))
        );
        setEditingTeacher(null);
      } else {
        alert("Gagal mengupdate guru: " + (res.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nama || !createForm.nip) return;

    try {
      setSubmitting(true);
      const res = await createGuru({
        nama: createForm.nama,
        nip: createForm.nip,
        jabatan: createForm.jabatan || "Guru Pengampu",
        no_telepon: createForm.no_telepon || "-",
        alamat: createForm.alamat || "-",
        status: createForm.status,
        jenis_kelamin: createForm.jenis_kelamin,
      });

      if (res.success) {
        await loadTeachers();
        setCreateForm({
          nama: "",
          nip: "",
          jabatan: "",
          no_telepon: "",
          alamat: "",
          status: "aktif",
          jenis_kelamin: "Laki-Laki",
        });
        setViewMode("list");
      } else {
        alert("Gagal menambah guru: " + (res.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) return <div className="min-h-[400px] flex items-center justify-center text-slate-400">Memuat data guru...</div>;

  if (viewMode === "create") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Tambah Data Guru</h1>
            <p className="text-sm text-slate-500 mt-1">Lengkapi data berikut, lalu tambah ke daftar guru.</p>
          </div>
          <ClockBadges />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6">Informasi Guru</h2>

          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Nama lengkap</label>
                <input
                  type="text"
                  placeholder="Pilih / ketik nama guru"
                  value={createForm.nama}
                  onChange={(e) => setCreateForm({ ...createForm, nama: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">NIP</label>
                <input
                  type="text"
                  placeholder="1987011201"
                  value={createForm.nip}
                  onChange={(e) => setCreateForm({ ...createForm, nip: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Jabatan</label>
                <input
                  type="text"
                  placeholder="Guru Matematika"
                  value={createForm.jabatan}
                  onChange={(e) => setCreateForm({ ...createForm, jabatan: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Nomor telepon</label>
                <input
                  type="text"
                  placeholder="0812 3344 5566"
                  value={createForm.no_telepon}
                  onChange={(e) => setCreateForm({ ...createForm, no_telepon: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-800">Alamat</label>
                <input
                  type="text"
                  placeholder="Jl. Pendidikan No. 10, Bandung"
                  value={createForm.alamat}
                  onChange={(e) => setCreateForm({ ...createForm, alamat: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Status</label>
                <div className="relative">
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as "aktif" | "nonaktif" })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Jenis kelamin</label>
                <div className="relative">
                  <select
                    value={createForm.jenis_kelamin}
                    onChange={(e) => setCreateForm({ ...createForm, jenis_kelamin: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="Laki-Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Kelola Data Guru</h1>
          <p className="text-sm text-slate-500 mt-1">Tambah, lihat, dan perbarui data guru.</p>
        </div>
        <ClockBadges />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[280px]">
          <input
            type="text"
            placeholder="Cari nama / NIP..."
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
          <span>Tambah Guru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              <th className="pb-4 font-semibold w-[24%]">NAMA GURU</th>
              <th className="pb-4 font-semibold w-[16%]">NIP</th>
              <th className="pb-4 font-semibold w-[20%]">JABATAN</th>
              <th className="pb-4 font-semibold w-[18%]">NO. TELEPON</th>
              <th className="pb-4 font-semibold w-[12%]">STATUS</th>
              <th className="pb-4 font-semibold text-right w-[10%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada data guru yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((guru) => (
                <tr key={guru.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-bold text-slate-900">{guru.nama}</td>
                  <td className="py-4 text-slate-500 font-medium">{guru.nip}</td>
                  <td className="py-4 text-slate-500 font-medium">{guru.jabatan || "-"}</td>
                  <td className="py-4 text-slate-500 font-medium">{guru.no_telepon || "-"}</td>
                  <td className="py-4 font-medium text-slate-600">
                    {guru.status?.toLowerCase() === "aktif" ? "Aktif" : "Nonaktif"}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleOpenEdit(guru)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                        title="Edit Guru"
                      >
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={() => setDeletingTeacher(guru)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Hapus Guru"
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

      <Modal isOpen={!!deletingTeacher} onClose={() => setDeletingTeacher(null)} maxWidth="max-w-md">
        <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
          <span className="text-2xl font-bold leading-none">!</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Hapus Data?</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <p className="text-sm font-semibold text-slate-700">Apakah Anda yakin ingin menghapus data yang dipilih?</p>
        <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Data terpilih</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{deletingTeacher?.nama}</p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setDeletingTeacher(null)}
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
      </Modal>

      <Modal isOpen={!!editingTeacher} onClose={() => setEditingTeacher(null)} maxWidth="max-w-2xl">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Update Data Guru</h3>
          <p className="text-xs text-slate-400 mt-0.5">Perbarui informasi guru yang dipilih.</p>
        </div>
        <form onSubmit={handleSaveEdit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Nama lengkap</label>
              <input
                type="text"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">NIP</label>
              <input
                type="text"
                value={editForm.nip}
                onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Jabatan</label>
              <input
                type="text"
                value={editForm.jabatan}
                onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Nomor telepon</label>
              <input
                type="text"
                value={editForm.no_telepon}
                onChange={(e) => setEditForm({ ...editForm, no_telepon: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800">Alamat</label>
              <input
                type="text"
                value={editForm.alamat}
                onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Status</label>
              <div className="relative">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "aktif" | "nonaktif" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Jenis kelamin</label>
              <div className="relative">
                <select
                  value={editForm.jenis_kelamin}
                  onChange={(e) => setEditForm({ ...editForm, jenis_kelamin: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="Laki-Laki">Laki-Laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setEditingTeacher(null)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Update Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

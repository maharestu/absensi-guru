"use client";

import React, { useState, useEffect } from "react";
import { Guru } from "@/types/schema";
import { getGuruList, createGuru, updateGuru, deleteGuru } from "@/actions/guru";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";
import TeacherForm, { TeacherFormData } from "./TeacherForm";
import Pagination from "@/components/ui/pagination";

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
    status: "aktif" as "aktif" | "nonaktif",

  });

  const [editForm, setEditForm] = useState({
    nama: "",
    nip: "",
    jabatan: "",
    no_telepon: "",
    status: "aktif" as "aktif" | "nonaktif",

  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]); 
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
      status: (guru.status?.toLowerCase() === "nonaktif" ? "nonaktif" : "aktif") as "aktif" | "nonaktif",

    });
  };

  const handleSaveEdit = async (data: TeacherFormData) => {
    if (!editingTeacher) return;

    try {
      setSubmitting(true);
      const updateData = {
        nama: data.nama,
        nip: data.nip,
        jabatan: data.jabatan,
        no_telepon: data.no_telepon,
        status: data.status,

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

  const handleCreateSubmit = async (data: TeacherFormData) => {
    if (!data.nama || !data.nip) return;

    try {
      setSubmitting(true);
      const res = await createGuru({
        nama: data.nama,
        nip: data.nip,
        jabatan: data.jabatan || "Guru Pengampu",
        no_telepon: data.no_telepon || "-",
        status: data.status,

      });

      if (res.success) {
        await loadTeachers();
        setCreateForm({
          nama: "",
          nip: "",
          jabatan: "",
          no_telepon: "",
          status: "aktif",

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

    const paginatedList = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isLoaded) return <div className="min-h-[400px] flex items-center justify-center text-slate-400">Memuat data guru...</div>;



  
// reset page if search changes

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
            placeholder="Cari nama / NIP/NUPTK..."
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
              <th className="pb-4 font-semibold w-[16%]">NIP/NUPTK</th>
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
              paginatedList.map((guru) => (
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
        {/* Komponen Paginasi */}
        {filteredTeachers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredTeachers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

      <Modal isOpen={!!deletingTeacher} onClose={() => setDeletingTeacher(null)} maxWidth="max-w-md">
        {/* Header: ikon + judul sejajar */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-200 flex-shrink-0">
            <span className="text-2xl font-bold leading-none">!</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">Hapus Data?</h3>
            <p className="text-sm text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>

        {/* Pertanyaan konfirmasi */}
        <p className="text-sm text-slate-700">
          Apakah Anda yakin ingin menghapus data yang dipilih?
        </p>

        {/* Card data terpilih */}
        <div className="bg-[#f0f4f9] rounded-xl px-4 py-3">
          <p className="text-xs text-slate-400 font-medium mb-1">Data terpilih</p>
          <p className="text-sm font-bold text-slate-900">{deletingTeacher?.nama}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Tombol — rata kanan, lebar auto */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setDeletingTeacher(null)}
            className="min-w-[110px] px-6 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-center"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmDelete}
            className="px-6 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-sm font-bold text-white shadow-sm shadow-red-200 transition-all disabled:opacity-50"
          >
            {submitting ? "Menghapus..." : "Hapus Data"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!editingTeacher} onClose={() => setEditingTeacher(null)} maxWidth="max-w-3xl">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Update Data Guru</h3>
          <p className="text-xs text-slate-400 mt-0.5">Perbarui informasi guru yang dipilih.</p>
        </div>
        <div className="mt-6">
          <TeacherForm
            initialData={editForm}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditingTeacher(null)}
            submitting={submitting}
            submitText="Simpan Perubahan"
          />
        </div>
      </Modal>

      <Modal isOpen={viewMode === "create"} onClose={() => setViewMode("list")} maxWidth="max-w-3xl">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Tambah Data Guru</h3>
          <p className="text-sm text-slate-500 mt-1">Lengkapi data berikut, lalu tambah ke daftar.</p>
        </div>
        <div className="mt-6">
          <TeacherForm
            initialData={createForm}
            onSubmit={handleCreateSubmit}
            onCancel={() => setViewMode("list")}
            submitting={submitting}
            submitText="Tambah Data"
          />
        </div>
      </Modal>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Guru } from "@/types/schema";
import { getGuruList, createGuru, updateGuru, deleteGuru, deleteAllGuru, checkGuruRelations } from "@/actions/guru";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";
import TeacherForm, { TeacherFormData } from "./TeacherForm";
import Pagination from "@/components/ui/pagination";
import { DeleteSingleModal } from "./ui/DeleteSingleModal";
import { DeleteAllModal, RelationAuditResult } from "./ui/DeleteAllModal";

export default function TeacherManagerClient() {

  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [editingTeacher, setEditingTeacher] = useState<Guru | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Guru | null>(null);
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

  // States untuk Hapus Semua
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isCheckingRelations, setIsCheckingRelations] = useState(false);
  const [relationAudit, setRelationAudit] = useState<RelationAuditResult | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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
      setSingleDeleteError(null);
      const res = await deleteGuru(deletingTeacher.id);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => t.id !== deletingTeacher.id));
        setDeletingTeacher(null);
      } else {
        setSingleDeleteError(res.error || "Gagal menghapus data guru.");
      }
    } catch (err: any) {
      setSingleDeleteError(err.message || "Terjadi kesalahan saat menghapus data guru.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteAll = async () => {
    setIsDeleteAllOpen(true);
    setIsCheckingRelations(true);
    setRelationAudit(null);
    try {
      const audit = await checkGuruRelations();
      setRelationAudit(audit);
    } catch (e) {
      console.error(e);
      setRelationAudit({ hasRelations: false, details: [] });
    } finally {
      setIsCheckingRelations(false);
    }
  };

  const handleConfirmDeleteAll = async (forceCascade: boolean) => {
    try {
      setIsDeletingAll(true);
      const res = await deleteAllGuru(forceCascade);
      if (res.success) {
        setTeachers([]);
        setIsDeleteAllOpen(false);
      } else {
        alert("Gagal menghapus semua data guru: " + (res.error || ""));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsDeletingAll(false);
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
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setViewMode("create")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Tambah Guru</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDeleteAll}
            disabled={teachers.length === 0}
            className="px-4 py-2.5 rounded-xl border border-red-200/90 bg-red-50 hover:bg-red-100 active:scale-[0.98] text-sm font-semibold text-red-600 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua</span>
          </button>
        </div>
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

      <DeleteSingleModal
        isOpen={!!deletingTeacher}
        onClose={() => {
          setDeletingTeacher(null);
          setSingleDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Guru"
        itemName={deletingTeacher?.nama}
        isDeleting={submitting}
        errorRelation={singleDeleteError}
        onClearError={() => setSingleDeleteError(null)}
      />

      <DeleteAllModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Hapus Semua Data Guru"
        entityName="guru"
        totalCount={teachers.length}
        isChecking={isCheckingRelations}
        relationInfo={relationAudit}
        isDeleting={isDeletingAll}
      />


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

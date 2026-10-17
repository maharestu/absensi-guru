"use client";

import React, { useState, useEffect } from "react";
import type { AdminAkunItem } from "@/types/admin";
import { getAkunList, createAkun, updateAkun, deleteAkun, deleteAllAkun, checkAkunRelations } from "@/actions/akun";
import { getGuruList } from "@/actions/guru";
import { Guru } from "@/types/schema";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { ChevronDown, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import { useAuth } from "@/context/AuthContext";
import { DeleteSingleModal } from "./ui/DeleteSingleModal";
import { DeleteAllModal, RelationAuditResult } from "./ui/DeleteAllModal";
import { SearchableSelect } from "@/components/ui/searchable-select";

const ROLE_OPTIONS: AdminAkunItem["role"][] = ["guru", "admin", "kepala_sekolah"];
const STATUS_OPTIONS: AdminAkunItem["status"][] = ["aktif", "nonaktif"];

const ROLE_LABEL: Record<AdminAkunItem["role"], string> = {
  admin: "Admin",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
};

const ROLE_PRIORITY: Record<AdminAkunItem["role"], number> = {
  kepala_sekolah: 0,
  admin: 1,
  guru: 2,
};

export default function AccountManagerClient() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<AdminAkunItem[]>([]);
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [editingAccount, setEditingAccount] = useState<AdminAkunItem | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AdminAkunItem | null>(null);
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

  // States untuk Hapus Semua
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isCheckingRelations, setIsCheckingRelations] = useState(false);
  const [relationAudit, setRelationAudit] = useState<RelationAuditResult | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [createForm, setCreateForm] = useState({
    nama: "",
    username: "",
    nip: "",
    password: "",
    role: "guru" as AdminAkunItem["role"],
    status: "aktif" as AdminAkunItem["status"],
    guru_id: "" as string | null,
  });

  const [editForm, setEditForm] = useState({
    nama: "",
    username: "",
    role: "guru" as AdminAkunItem["role"],
    status: "aktif" as AdminAkunItem["status"],
    passwordBaru: "",
    konfirmasiPassword: "",
  });

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  const loadData = async () => {
    try {
      const [accList, guruList] = await Promise.all([
        getAkunList(),
        getGuruList(),
      ]);
      setAccounts(accList);
      setTeachers(guruList);
    } catch (e) {
      console.error("Gagal mengambil data akun / guru:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccounts = accounts
    .filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (a.username || "").toLowerCase().includes(q) ||
        (a.nama || "").toLowerCase().includes(q) ||
        (a.role || "").toLowerCase().includes(q) ||
        (ROLE_LABEL[a.role] || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const priorityA = ROLE_PRIORITY[a.role] ?? 99;
      const priorityB = ROLE_PRIORITY[b.role] ?? 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return (a.nama || "").localeCompare(b.nama || "");
    });

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    try {
      setSubmitting(true);
      setSingleDeleteError(null);
      const res = await deleteAkun(deletingAccount.id, user?.id);
      if (res.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== deletingAccount.id));
        setDeletingAccount(null);
      } else {
        setSingleDeleteError(res.error || "Gagal menghapus akun.");
      }
    } catch (err: any) {
      setSingleDeleteError(err.message || "Error saat menghapus akun.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteAll = async () => {
    setIsDeleteAllOpen(true);
    setIsCheckingRelations(true);
    setRelationAudit(null);
    try {
      const audit = await checkAkunRelations(user?.id);
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
      const res = await deleteAllAkun(user?.id);
      if (res.success) {
        setIsDeleteAllOpen(false);
        await loadData();
      } else {
        alert(res.error || "Gagal menghapus seluruh akun.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleOpenEdit = (akun: AdminAkunItem) => {
    setEditingAccount(akun);
    setEditForm({
      nama: akun.nama,
      username: akun.username,
      role: akun.role,
      status: akun.status,
      passwordBaru: "",
      konfirmasiPassword: "",
    });
    setShowEditPassword(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (editForm.passwordBaru && editForm.passwordBaru !== editForm.konfirmasiPassword) {
      alert("Password baru dan konfirmasi password tidak cocok!");
      return;
    }

    try {
      setSubmitting(true);
      const payload: {
        nama: string;
        username: string;
        role: AdminAkunItem["role"];
        status: AdminAkunItem["status"];
        password?: string;
      } = {
        nama: editForm.nama,
        username: editForm.username,
        role: editForm.role,
        status: editForm.status,
      };

      if (editForm.passwordBaru) {
        payload.password = editForm.passwordBaru;
      }

      const res = await updateAkun(editingAccount.id, payload);
      if (res.success) {
        await loadData();
        setEditingAccount(null);
      } else {
        alert("Gagal mengupdate akun: " + (res.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find((g) => g.id === teacherId);
    if (teacher) {
      const parts = teacher.nama.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
      const secondPart = teacher.nama.split(" ")[1]?.charAt(0).toLowerCase() || "";
      const generatedUsername = secondPart ? `${parts}.${secondPart}` : parts;

      setCreateForm({
        ...createForm,
        nama: teacher.nama,
        username: generatedUsername,
        nip: teacher.nip || "",
        role: "guru",
        guru_id: teacher.id,
      });
    } else {
      setCreateForm({
        ...createForm,
        nama: "",
        username: "",
        nip: "",
        guru_id: null,
      });
    }
  };

  const handleSelectTeacherForEdit = (teacherId: string) => {
    const teacher = teachers.find((g) => g.id === teacherId);
    if (teacher) {
      const parts = teacher.nama.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
      const secondPart = teacher.nama.split(" ")[1]?.charAt(0).toLowerCase() || "";
      const generatedUsername = secondPart ? `${parts}.${secondPart}` : parts;

      setEditForm({
        ...editForm,
        nama: teacher.nama,
        username: generatedUsername,
        role: "guru",
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nama || !createForm.username || !createForm.password || !createForm.role) {
      alert("Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    if (createForm.role === "guru" && !createForm.guru_id) {
      alert("Validasi Gagal: Untuk Role Guru, nama pemilik akun harus terdaftar di sistem. Silakan pilih dari daftar pencarian.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createAkun({
        nama: createForm.nama,
        username: createForm.username,
        password: createForm.password,
        role: createForm.role,
        guru_id: createForm.guru_id || null,
      });

      if (res.success) {
        await loadData();
        setCreateForm({
          nama: "",
          username: "",
          nip: "",
          password: "",
          role: "guru",
          status: "aktif",
          guru_id: null,
        });
        setShowCreatePassword(false);
        setViewMode("list");
      } else {
        alert("Gagal membuat akun: " + (res.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedList = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: `${t.nama} (NIP: ${t.nip || "-"})`,
  }));

  if (!isLoaded) return <div className="min-h-[400px] flex items-center justify-center text-slate-400">Memuat data akun...</div>;




  // reset page if search changes

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Kelola Akun</h1>
          <p className="text-sm text-slate-500 mt-1">Tambah, lihat, dan perbarui data akun.</p>
        </div>
        <ClockBadges />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[280px]">
          <input
            type="text"
            placeholder="Cari nama / username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("create")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Tambah Akun</span>
          </button>
          <button
            type="button"
            disabled={accounts.length === 0}
            onClick={handleOpenDeleteAll}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-[0.98] text-sm font-bold text-red-600 border border-red-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Hapus Semua Data Akun"
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
              <th className="pb-4 font-semibold w-[28%]">NAMA</th>
              <th className="pb-4 font-semibold w-[22%]">USERNAME</th>
              <th className="pb-4 font-semibold w-[20%]">ROLE</th>
              <th className="pb-4 font-semibold w-[18%]">TERAKHIR DILIHAT</th>
              <th className="pb-4 font-semibold text-right w-[12%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada akun yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              paginatedList.map((akun) => (
                <tr key={akun.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-bold text-slate-900">
                    <div>{akun.nama}</div>
                    {akun.nip && <span className="text-xs text-slate-400 font-normal">NIP/NUPTK: {akun.nip}</span>}
                  </td>
                  <td className="py-4 text-slate-600 font-normal">{akun.username}</td>
                  <td className="py-4 text-slate-600 font-normal">{ROLE_LABEL[akun.role] || akun.role}</td>
                  <td className="py-4 text-slate-500 font-normal">
                    {akun.terakhir_dilihat ?? "-"}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleOpenEdit(akun)}
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1 cursor-pointer"
                        title="Edit Akun"
                      >
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={() => setDeletingAccount(akun)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Hapus Akun"
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
        {filteredAccounts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAccounts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

      {/* Modal Hapus Satu Akun */}
      <DeleteSingleModal
        isOpen={!!deletingAccount}
        onClose={() => {
          setDeletingAccount(null);
          setSingleDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Akun"
        itemName={deletingAccount ? `${deletingAccount.nama} (${deletingAccount.username})` : ""}
        isDeleting={submitting}
        errorRelation={singleDeleteError}
        onClearError={() => setSingleDeleteError(null)}
      />

      {/* Modal Hapus Semua Akun */}
      <DeleteAllModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Hapus Semua Akun"
        entityName="akun pengguna"
        totalCount={accounts.length}
        isChecking={isCheckingRelations}
        relationInfo={relationAudit}
        isDeleting={isDeletingAll}
      />

      <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} maxWidth="max-w-2xl">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Update Data Akun</h3>
          <p className="text-xs text-slate-400 mt-0.5">Perbarui akses dan status pengguna.</p>
        </div>
        <form onSubmit={handleSaveEdit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">Nama pemilik akun</label>
              {editForm.role === "guru" ? (
                <SearchableSelect
                  options={teacherOptions}
                  value={teachers.find((t) => t.nama.trim().toLowerCase() === editForm.nama.trim().toLowerCase())?.id || ""}
                  onChange={handleSelectTeacherForEdit}
                  placeholder={editForm.nama || "Pilih guru..."}
                />
              ) : (
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Role</label>
              <div className="relative">
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as AdminAkunItem["role"] })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Status akun</label>
              <div className="relative">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AdminAkunItem["status"] })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Password baru (opsional)</label>
              <div className="relative">
                <input
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  value={editForm.passwordBaru}
                  onChange={(e) => setEditForm({ ...editForm, passwordBaru: e.target.value })}
                  className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showEditPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Konfirmasi password</label>
              <input
                type="password"
                placeholder="Ulangi password baru"
                value={editForm.konfirmasiPassword}
                onChange={(e) => setEditForm({ ...editForm, konfirmasiPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setEditingAccount(null)}
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
      </Modal>

      {/* MODAL: TAMBAH AKUN */}
      <Modal isOpen={viewMode === "create"} onClose={() => setViewMode("list")} maxWidth="max-w-3xl">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Tambah Akun</h3>
          <p className="text-sm text-slate-500 mt-1">Lengkapi data berikut, lalu tambah ke daftar.</p>
        </div>
        <form onSubmit={handleCreateSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nama Pemilik Akun */}
            <div className="space-y-2 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">Nama pemilik akun</label>
              {createForm.role === "guru" ? (
                <SearchableSelect
                  options={teacherOptions}
                  value={createForm.guru_id || ""}
                  onChange={handleSelectTeacher}
                  placeholder="Pilih guru..."
                />
              ) : (
                <input
                  type="text"
                  placeholder=""
                  value={createForm.nama}
                  onChange={(e) => setCreateForm({ ...createForm, nama: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              )}
            </div>

            {/* Username */}
            <div className="space-y-2 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">Username</label>
              <input
                type="text"
                placeholder=""
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>

            {/* NIP */}
            <div className="space-y-2 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">NIP/NUPTK</label>
              <input
                type="text"
                placeholder=""
                value={createForm.nip}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 bg-slate-50 outline-none cursor-not-allowed"
              />
            </div>

            {/* Role */}
            <div className="space-y-2 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">Role</label>
              <div className="relative">
                <select
                  value={createForm.role}
                  onChange={(e) => {
                    const newRole = e.target.value as AdminAkunItem["role"];
                    setCreateForm({ ...createForm, role: newRole, guru_id: newRole !== "guru" ? null : createForm.guru_id, nama: newRole !== "guru" ? "" : createForm.nama });
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="" disabled>Pilih role</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Status akun */}
            <div className="space-y-2 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">Status akun</label>
              <div className="relative">
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as AdminAkunItem["status"] })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="" disabled>Pilih status akun</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2 flex flex-col">
              <label className="block text-xs font-semibold text-slate-800">Password</label>
              <div className="relative">
                <input
                  type={showCreatePassword ? "text" : "password"}
                  placeholder=""
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showCreatePassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Tambah Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

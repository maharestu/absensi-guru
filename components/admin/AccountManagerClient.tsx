"use client";

import React, { useState, useEffect } from "react";
import type { AdminAkunItem } from "@/types/admin";
import { getAkunList, createAkun, updateAkun, deleteAkun } from "@/actions/akun";
import { getGuruList } from "@/actions/guru";
import { Guru } from "@/types/schema";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { ChevronDown, Edit2, Trash2, Eye, EyeOff } from "lucide-react";

const ROLE_OPTIONS: AdminAkunItem["role"][] = ["guru", "admin", "kepala_sekolah"];
const STATUS_OPTIONS: AdminAkunItem["status"][] = ["aktif", "nonaktif"];

const ROLE_LABEL: Record<AdminAkunItem["role"], string> = {
  admin: "Admin",
  kepala_sekolah: "Kepala Sekolah",
  guru: "Guru",
};

export default function AccountManagerClient() {
  const [accounts, setAccounts] = useState<AdminAkunItem[]>([]);
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [editingAccount, setEditingAccount] = useState<AdminAkunItem | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AdminAkunItem | null>(null);

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

  const filteredAccounts = accounts.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (a.username || "").toLowerCase().includes(q) ||
      (a.nama || "").toLowerCase().includes(q) ||
      (a.role || "").toLowerCase().includes(q) ||
      (ROLE_LABEL[a.role] || "").toLowerCase().includes(q)
    );
  });

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    try {
      setSubmitting(true);
      const res = await deleteAkun(deletingAccount.id);
      if (res.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== deletingAccount.id));
        setDeletingAccount(null);
      } else {
        alert("Gagal menghapus akun: " + (res.error || ""));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nama || !createForm.username || !createForm.password || !createForm.role) {
      alert("Mohon lengkapi semua field yang wajib diisi!");
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

  if (!isLoaded) return <div className="min-h-[400px] flex items-center justify-center text-slate-400">Memuat data akun...</div>;

  if (viewMode === "create") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Tambah Akun</h1>
            <p className="text-sm text-slate-500 mt-1">Lengkapi data berikut, lalu simpan perubahan</p>
          </div>
          <ClockBadges />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Informasi Akun
          </h2>
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Tautkan ke Guru (Opsional)</label>
                <div className="relative">
                  <select
                    value={createForm.guru_id || ""}
                    onChange={(e) => handleSelectTeacher(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">-- Pilih Guru yang Ada --</option>
                    {teachers.map((guru) => (
                      <option key={guru.id} value={guru.id}>
                        {guru.nama} ({guru.nip})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Ketik nama lengkap"
                  value={createForm.nama}
                  onChange={(e) => setCreateForm({ ...createForm, nama: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Username</label>
                <input
                  type="text"
                  placeholder="ahmad.f"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">NIP (Readonly / Terisi Otomatis)</label>
                <input
                  type="text"
                  placeholder="1987011201"
                  value={createForm.nip}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-500 bg-slate-50 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Role</label>
                <div className="relative">
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as AdminAkunItem["role"] })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
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

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
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
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Manajemen Akun</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data login pengguna dan role-nya.</p>
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
        <button
          onClick={() => setViewMode("create")}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <span>+</span>
          <span>Tambah Akun</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              <th className="pb-4 font-semibold w-[28%]">NAMA</th>
              <th className="pb-4 font-semibold w-[22%]">USERNAME</th>
              <th className="pb-4 font-semibold w-[20%]">ROLE</th>
              <th className="pb-4 font-semibold w-[18%]">STATUS</th>
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
              filteredAccounts.map((akun) => (
                <tr key={akun.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-bold text-slate-900">
                    <div>{akun.nama}</div>
                    {akun.nip && <span className="text-xs text-slate-400 font-normal">NIP: {akun.nip}</span>}
                  </td>
                  <td className="py-4 text-slate-600 font-normal">{akun.username}</td>
                  <td className="py-4 text-slate-600 font-normal">{ROLE_LABEL[akun.role] || akun.role}</td>
                  <td className="py-4 text-slate-500 font-normal capitalize">
                    {akun.status === "aktif" ? (
                      <span className="text-emerald-600 font-medium">Aktif</span>
                    ) : (
                      <span className="text-slate-400 font-medium">Nonaktif</span>
                    )}
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
      </div>

      <Modal isOpen={!!deletingAccount} onClose={() => setDeletingAccount(null)} maxWidth="max-w-md">
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
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {deletingAccount?.nama} • {deletingAccount?.username}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setDeletingAccount(null)}
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

      <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} maxWidth="max-w-2xl">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Update Data Akun</h3>
          <p className="text-xs text-slate-400 mt-0.5">Perbarui akses dan status pengguna.</p>
        </div>
        <form onSubmit={handleSaveEdit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Nama pemilik akun</label>
              <input
                type="text"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
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
    </div>
  );
}

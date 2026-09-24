"use client";

import React, { useState, useEffect } from "react";
import {
  AdminAkunItem,
  MOCK_ADMIN_AKUN_LIST,
  MOCK_GURU_LIST,
} from "@/lib/mock-data";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { ChevronDown, Edit2, Trash2, Eye, EyeOff } from "lucide-react";

const STORAGE_KEY = "admin_akun_list";

const ROLE_OPTIONS: AdminAkunItem["role"][] = ["GURU", "ADMIN", "KEPSEK"];
const STATUS_OPTIONS: AdminAkunItem["status"][] = ["AKTIF", "NONAKTIF"];

const ROLE_LABEL: Record<AdminAkunItem["role"], string> = {
  ADMIN: "Admin",
  KEPSEK: "Kepala Sekolah",
  GURU: "Guru",
};

export default function AccountManagerClient() {
  const [accounts, setAccounts] = useState<AdminAkunItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [editingAccount, setEditingAccount] = useState<AdminAkunItem | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AdminAkunItem | null>(null);

  const [createForm, setCreateForm] = useState({
    nama: "",
    username: "",
    nip: "",
    password: "",
    role: "" as AdminAkunItem["role"] | "",
    status: "AKTIF" as AdminAkunItem["status"] | "",
  });

  const [editForm, setEditForm] = useState({
    nama: "",
    username: "",
    role: "GURU" as AdminAkunItem["role"],
    status: "AKTIF" as AdminAkunItem["status"],
    passwordBaru: "",
    konfirmasiPassword: "",
  });

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAccounts(parsed);
          } else {
            setAccounts(MOCK_ADMIN_AKUN_LIST);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ADMIN_AKUN_LIST));
          }
        } catch (e) {
          console.error("Gagal parse local storage akun:", e);
          setAccounts(MOCK_ADMIN_AKUN_LIST);
        }
      } else {
        setAccounts(MOCK_ADMIN_AKUN_LIST);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ADMIN_AKUN_LIST));
      }
      setIsLoaded(true);
    }
  }, []);

  const saveAccountsToStorage = (updatedList: AdminAkunItem[]) => {
    setAccounts(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.username.toLowerCase().includes(q) ||
      a.nama.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      ROLE_LABEL[a.role].toLowerCase().includes(q)
    );
  });

  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    const updated = accounts.filter((a) => a.id !== deletingAccount.id);
    saveAccountsToStorage(updated);
    setDeletingAccount(null);
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const updated = accounts.map((a) => {
      if (a.id === editingAccount.id) {
        return {
          ...a,
          nama: editForm.nama,
          username: editForm.username,
          role: editForm.role,
          status: editForm.status,
          password: editForm.passwordBaru ? editForm.passwordBaru : a.password,
        };
      }
      return a;
    });

    saveAccountsToStorage(updated);
    setEditingAccount(null);
  };

  const handleSelectTeacher = (teacherName: string) => {
    const teacher = MOCK_GURU_LIST.find((g) => g.nama === teacherName);
    if (teacher) {
      const parts = teacher.nama.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
      const secondPart = teacher.nama.split(" ")[1]?.charAt(0).toLowerCase() || "";
      const generatedUsername = secondPart ? `${parts}.${secondPart}` : parts;

      setCreateForm({
        ...createForm,
        nama: teacher.nama,
        username: generatedUsername,
        nip: teacher.nip || "",
        role: "GURU",
      });
    } else {
      setCreateForm({
        ...createForm,
        nama: teacherName,
      });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nama || !createForm.username || !createForm.role) return;

    const newAkun: AdminAkunItem = {
      id: `akun-${Date.now()}`,
      nama: createForm.nama,
      username: createForm.username,
      nip: createForm.nip || undefined,
      password: createForm.password || "password123",
      role: (createForm.role as AdminAkunItem["role"]) || "GURU",
      status: (createForm.status as AdminAkunItem["status"]) || "AKTIF",
      terakhir_dilihat: "Baru saja",
      created_at: new Date().toISOString().split("T")[0],
    };

    const updated = [newAkun, ...accounts];
    saveAccountsToStorage(updated);

    setCreateForm({ nama: "", username: "", nip: "", password: "", role: "", status: "AKTIF" });
    setShowCreatePassword(false);
    setViewMode("list");
  };

  if (!isLoaded) return <div className="min-h-[400px]" />;

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
                <label className="block text-xs font-semibold text-slate-800">Nama pemilik akun</label>
                <div className="relative">
                  <select
                    value={createForm.nama}
                    onChange={(e) => handleSelectTeacher(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih nama pemilik akun</option>
                    {MOCK_GURU_LIST.map((guru) => (
                      <option key={guru.id} value={guru.nama}>{guru.nama}</option>
                    ))}
                    <option value="Admin Sekolah">Admin Sekolah</option>
                    <option value="Drs. Budi Santoso">Drs. Budi Santoso (Kepala Sekolah)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
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
                <label className="block text-xs font-semibold text-slate-800">NIP</label>
                <input
                  type="text"
                  placeholder="1987011201"
                  value={createForm.nip}
                  onChange={(e) => setCreateForm({ ...createForm, nip: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Role</label>
                <div className="relative">
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as AdminAkunItem["role"] | "" })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih role</option>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Status akun</label>
                <div className="relative">
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as AdminAkunItem["status"] })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Pilih status akun</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800">Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                  <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                    {showCreatePassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setViewMode("list")} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all">
                + Tambah Data
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
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Kelola Akun</h1>
          <p className="text-sm text-slate-500 mt-1">Tambah, lihat, dan perbarui data akun.</p>
        </div>
        <ClockBadges />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[280px]">
          <input
            type="text"
            placeholder="Cari username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F9] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border border-transparent transition-all"
          />
        </div>
        <button onClick={() => setViewMode("create")} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto">
          <span>+</span>
          <span>Tambah Akun</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              <th className="pb-4 font-semibold w-[28%]">NAMA</th>
              <th className="pb-4 font-semibold w-[22%]">USERNAME</th>
              <th className="pb-4 font-semibold w-[18%]">ROLE</th>
              <th className="pb-4 font-semibold w-[22%]">TERAKHIR DILIHAT</th>
              <th className="pb-4 font-semibold text-right w-[10%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-medium">Tidak ada data akun yang sesuai dengan pencarian.</td></tr>
            ) : (
              filteredAccounts.map((akun) => (
                <tr key={akun.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-bold text-slate-900">{akun.nama}</td>
                  <td className="py-4 text-slate-600 font-normal">{akun.username}</td>
                  <td className="py-4 text-slate-600 font-normal">{ROLE_LABEL[akun.role]}</td>
                  <td className="py-4 text-slate-500 font-normal">{akun.terakhir_dilihat}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleOpenEdit(akun)} className="text-slate-400 hover:text-slate-800 transition-colors p-1 cursor-pointer" title="Edit Akun">
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                      <button onClick={() => setDeletingAccount(akun)} className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer" title="Hapus Akun">
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
          <button type="button" onClick={() => setDeletingAccount(null)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button type="button" onClick={handleConfirmDelete} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all">
            Hapus Data
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
              <input type="text" value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Username</label>
              <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Role</label>
              <div className="relative">
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as AdminAkunItem["role"] })} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer">
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Status akun</label>
              <div className="relative">
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AdminAkunItem["status"] })} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white appearance-none cursor-pointer">
                  <option value="AKTIF">Aktif</option>
                  <option value="NONAKTIF">Nonaktif</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Password baru (opsional)</label>
              <div className="relative">
                <input type={showEditPassword ? "text" : "password"} placeholder="Masukkan password baru" value={editForm.passwordBaru} onChange={(e) => setEditForm({ ...editForm, passwordBaru: e.target.value })} className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
                <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                  {showEditPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">Konfirmasi password</label>
              <input type="password" placeholder="Ulangi password baru" value={editForm.konfirmasiPassword} onChange={(e) => setEditForm({ ...editForm, konfirmasiPassword: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setEditingAccount(null)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm transition-all">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

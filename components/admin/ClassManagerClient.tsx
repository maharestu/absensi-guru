"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Kelas } from "@/types/schema";
import { getKelasList, createKelas, updateKelas, deleteKelas } from "@/actions/kelas";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Modal } from "./ui/Modal";
import { Button } from "../ui/button";
import Pagination from "@/components/ui/pagination";

export default function ClassManagerClient() {

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Kelas | null>(null);

  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editingClass, setEditingClass] = useState<Kelas | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingClass, setDeletingClass] = useState<Kelas | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { timeString, dateString } = useRealtimeClock();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]); 
  const loadData = async () => {
    try {
      const data = await getKelasList();
      setKelasList(data);
    } catch (e) {
      console.error("Gagal mengambil data kelas:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredKelas = kelasList.filter((k) =>
    (k.nama_kelas || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrintQR = () => {
    // In a real app, this would trigger a print action or generate a PDF.
    window.print();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    try {
      setSubmitting(true);
      const res = await createKelas({ nama_kelas: createName });
      if (res.success) {
        setCreateMode(false);
        setCreateName("");
        loadData();
      } else {
        alert("Gagal menambah kelas: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editName.trim()) return;
    try {
      setSubmitting(true);
      const res = await updateKelas(editingClass.id, { nama_kelas: editName });
      if (res.success) {
        setEditingClass(null);
        setEditName("");
        loadData();
      } else {
        alert("Gagal update kelas: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    try {
      setSubmitting(true);
      const res = await deleteKelas(deletingClass.id);
      if (res.success) {
        setDeletingClass(null);
        loadData();
      } else {
        alert("Gagal menghapus kelas: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

    const paginatedList = filteredKelas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        Memuat data kelas...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Kelola Ruang Kelas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat data QR Code pada masing-masing kelas.
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-500">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{timeString}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-500">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-sm font-semibold text-slate-700">{dateString}</span>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-[400px]">
          <input
            type="text"
            placeholder="Cari nama kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border border-transparent transition-all"
          />
        </div>
        <button
          onClick={() => setCreateMode(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <span>+</span>
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              <th className="pb-4 font-semibold w-[80%]">Nama Kelas</th>
              <th className="pb-4 font-semibold text-right w-[20%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filteredKelas.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-center text-slate-400 font-medium">
                  Tidak ada ruang kelas yang cocok dengan "{searchQuery}".
                </td>
              </tr>
            ) : (
              paginatedList.map((kelas) => (
                <tr key={kelas.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-800">
                      {kelas.nama_kelas}
                    </div>
                  </td>
                  <td className="py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth={false}
                        onClick={() => setSelectedClass(kelas)}
                        className="bg-blue-600 hover:bg-blue-700 font-semibold px-6 py-2 h-auto"
                      >
                        Lihat QR
                      </Button>
                      <button
                        onClick={() => {
                          setEditingClass(kelas);
                          setEditName(kelas.nama_kelas);
                        }}
                        className="text-slate-400 hover:text-slate-800 transition-colors p-1 cursor-pointer ml-4"
                        title="Edit Kelas"
                      >
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={() => setDeletingClass(kelas)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer ml-1"
                        title="Hapus Kelas"
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
        {filteredKelas.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredKelas.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

      {/* QR Code Modal */}
      <Modal isOpen={!!selectedClass} onClose={() => setSelectedClass(null)} maxWidth="max-w-md">
        {selectedClass && (
          <div className="text-center space-y-6 flex flex-col items-center">
            <div className="space-y-2 text-center w-full">
              <h2 className="text-xl font-bold text-slate-900 text-left">
                QR Ruang {selectedClass.nama_kelas}
              </h2>
              <p className="text-sm text-slate-500 text-left">
                Berikut adalah QR Code kelas untuk melakukan absensi.
              </p>
            </div>

            {/* QR Image Wrapper */}
            <div className="bg-[#0f172a] p-4 rounded-3xl w-full flex items-center justify-center aspect-square max-w-[320px]">
              <div className="bg-white p-4 rounded-xl shadow-inner w-full h-full flex justify-center items-center">
                {/* Using API for generating dummy QR based on class ID */}
                {(() => {
                  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
                  // Pastikan tidak ada slash berlebih di akhir baseUrl
                  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
                  const qrUrl = `${cleanBaseUrl}/absen-qr/${selectedClass.kode_qr || selectedClass.id}`;
                  
                  
// reset page if search changes

  return (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`}
                      alt={`QR Code ${selectedClass.nama_kelas}`}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  );
                })()}
              </div>
            </div>

            <div className="flex w-full justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedClass(null)}
                fullWidth={false}
                className="px-6"
              >
                Tutup
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handlePrintQR}
                fullWidth={false}
                className="px-6"
              >
                Cetak QR
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah Kelas */}
      <Modal isOpen={createMode} onClose={() => setCreateMode(false)} maxWidth="max-w-[400px]">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-[22px] font-bold text-slate-900">Tambah Ruang Kelas</h3>
          <p className="text-sm text-slate-500 mt-1">Lengkapi data berikut, lalu simpan perubahan.</p>
        </div>
        <form onSubmit={handleCreate} className="space-y-6 mt-5">
          <div className="space-y-2 flex flex-col">
            <label className="block text-sm font-bold text-slate-900">Nama kelas</label>
            <input
              type="text"
              placeholder=""
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateMode(false)}
              disabled={submitting}
              className="w-[120px] py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-[120px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Tambah Data"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Kelas */}
      <Modal isOpen={!!editingClass} onClose={() => setEditingClass(null)} maxWidth="max-w-[400px]">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-[22px] font-bold text-slate-900">Update Data Ruang Kelas</h3>
          <p className="text-sm text-slate-500 mt-1">Perbarui informasi kelas yang dipilih.</p>
        </div>
        <form onSubmit={handleUpdate} className="space-y-6 mt-5">
          <div className="space-y-2 flex flex-col">
            <label className="block text-sm font-bold text-slate-900">Nama kelas</label>
            <input
              type="text"
              placeholder=""
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingClass(null)}
              disabled={submitting}
              className="w-[120px] py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-[120px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Kelas */}
      <Modal isOpen={!!deletingClass} onClose={() => setDeletingClass(null)} maxWidth="max-w-md">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-200 flex-shrink-0">
            <span className="text-2xl font-bold leading-none">!</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">Hapus Data?</h3>
            <p className="text-sm text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <p className="text-sm text-slate-700 mt-6">
          Apakah Anda yakin ingin menghapus data yang dipilih?
        </p>
        <div className="bg-[#f0f4f9] rounded-xl px-4 py-3 mt-4">
          <p className="text-xs text-slate-400 font-medium mb-1">Data terpilih</p>
          <p className="text-sm font-bold text-slate-900">
            {deletingClass?.nama_kelas}
          </p>
        </div>
        <div className="border-t border-slate-100 mt-6" />
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setDeletingClass(null)}
            className="min-w-[110px] px-6 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-center"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleDelete}
            className="px-6 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-[0.98] text-sm font-bold text-white shadow-sm shadow-red-200 transition-all disabled:opacity-50"
          >
            {submitting ? "Menghapus..." : "Hapus Data"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

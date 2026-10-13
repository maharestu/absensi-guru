"use client";

import React, { useState, useEffect } from "react";
import { getJadwalList, createJadwal, updateJadwal, deleteJadwal, deleteAllJadwal, checkJadwalRelations } from "@/actions/jadwal";
import { getGuruList } from "@/actions/guru";
import { getKelasList } from "@/actions/kelas";
import { Guru, Kelas, JadwalWithDetail, HariJadwal } from "@/types/schema";
import { ClockBadges } from "./ui/ClockBadges";
import { Edit2, Trash2 } from "lucide-react";
import ScheduleForm, { ScheduleFormData } from "./ScheduleForm";
import Pagination from "@/components/ui/pagination";
import { DeleteSingleModal } from "./ui/DeleteSingleModal";
import { DeleteAllModal, RelationAuditResult } from "./ui/DeleteAllModal";

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
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

  // States untuk Hapus Semua
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isCheckingRelations, setIsCheckingRelations] = useState(false);
  const [relationAudit, setRelationAudit] = useState<RelationAuditResult | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]); 
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
      setSingleDeleteError(null);
      const res = await deleteJadwal(deletingSchedule.id);
      if (res.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== deletingSchedule.id));
        setDeletingSchedule(null);
      } else {
        setSingleDeleteError(res.error || "Gagal menghapus jadwal.");
      }
    } catch (err: any) {
      setSingleDeleteError(err.message || "Error saat menghapus jadwal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteAll = async () => {
    setIsDeleteAllOpen(true);
    setIsCheckingRelations(true);
    setRelationAudit(null);
    try {
      const audit = await checkJadwalRelations();
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
      const res = await deleteAllJadwal(forceCascade);
      if (res.success) {
        setIsDeleteAllOpen(false);
        await loadAllData();
      } else {
        alert(res.error || "Gagal menghapus seluruh data jadwal.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsDeletingAll(false);
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
  const handleSaveEdit = async (data: ScheduleFormData) => {
    if (!editingSchedule) return;

    try {
      setSubmitting(true);
      await updateJadwal(editingSchedule.id, {
        hari: data.hari,
        kelas_id: data.kelas_id,
        guru_id: data.guru_id,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        mata_pelajaran: data.mata_pelajaran,
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
  const handleCreateSubmit = async (data: ScheduleFormData) => {
    if (!data.mata_pelajaran || !data.hari || !data.kelas_id || !data.guru_id) {
      alert("Mohon lengkapi seluruh formulir jadwal!");
      return;
    }

    try {
      setSubmitting(true);
      await createJadwal({
        hari: data.hari,
        kelas_id: data.kelas_id,
        guru_id: data.guru_id,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        mata_pelajaran: data.mata_pelajaran,
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

    const paginatedList = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isLoaded) {
    return <div className="min-h-[400px] flex items-center justify-center text-slate-400">Memuat data jadwal...</div>;
  }



  // ═══════════════════════════════════════════════════════════
  // VIEW: DAFTAR JADWAL
  // ═══════════════════════════════════════════════════════════
  
// reset page if search changes

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

        <ClockBadges />
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("create")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Tambah Jadwal</span>
          </button>
          <button
            type="button"
            disabled={schedules.length === 0}
            onClick={handleOpenDeleteAll}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 active:scale-[0.98] text-sm font-bold text-red-600 border border-red-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Hapus Semua Data Jadwal"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua</span>
          </button>
        </div>
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
              paginatedList.map((jadwal) => (
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
        {/* Komponen Paginasi */}
        {filteredSchedules.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSchedules.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

      {/* MODAL: HAPUS JADWAL TUNGGAL */}
      <DeleteSingleModal
        isOpen={!!deletingSchedule}
        onClose={() => {
          setDeletingSchedule(null);
          setSingleDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Jadwal"
        itemName={deletingSchedule ? `${deletingSchedule.mata_pelajaran} - ${deletingSchedule.kelas?.nama_kelas || ""} (${deletingSchedule.hari})` : ""}
        isDeleting={submitting}
        errorRelation={singleDeleteError}
        onClearError={() => setSingleDeleteError(null)}
      />

      {/* MODAL: HAPUS SEMUA JADWAL */}
      <DeleteAllModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Hapus Semua Jadwal"
        entityName="jadwal pelajaran"
        totalCount={schedules.length}
        isChecking={isCheckingRelations}
        relationInfo={relationAudit}
        isDeleting={isDeletingAll}
      />

      {/* MODAL: UPDATE JADWAL */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Update Jadwal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Perbarui waktu dan informasi jadwal mengajar.</p>
            </div>

            <div className="mt-6">
              <ScheduleForm
                initialData={editForm}
                kelasList={kelasList}
                guruList={guruList}
                onSubmit={handleSaveEdit}
                onCancel={() => setEditingSchedule(null)}
                submitting={submitting}
                submitText="Simpan Perubahan"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH JADWAL */}
      {viewMode === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tambah Jadwal</h3>
              <p className="text-sm text-slate-500 mt-1">Lengkapi data berikut, lalu tambah ke daftar.</p>
            </div>
            <div className="mt-6">
              <ScheduleForm
                initialData={createForm}
                kelasList={kelasList}
                guruList={guruList}
                onSubmit={handleCreateSubmit}
                onCancel={() => setViewMode("list")}
                submitting={submitting}
                submitText="Tambah Data"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

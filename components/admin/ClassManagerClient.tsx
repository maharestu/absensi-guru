"use client";

import React, { useState, useEffect, useRef } from "react";
import { Edit2, Trash2, Printer, Filter, ChevronDown } from "lucide-react";
import { Kelas } from "@/types/schema";
import { getKelasList, createKelas, updateKelas, deleteKelas, deleteAllKelas, checkKelasRelations } from "@/actions/kelas";
import { ClockBadges } from "./ui/ClockBadges";
import { Modal } from "./ui/Modal";
import { Button } from "../ui/button";
import Pagination from "@/components/ui/pagination";
import { DeleteSingleModal } from "./ui/DeleteSingleModal";
import { DeleteAllModal, RelationAuditResult } from "./ui/DeleteAllModal";
import { ClassA4PrintTemplate } from "./ClassA4PrintTemplate";
import { getLogoBase64 } from "@/actions/logo";

export default function ClassManagerClient() {

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState<"all" | "7" | "8" | "9">("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Kelas | null>(null);

  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [editingClass, setEditingClass] = useState<Kelas | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingClass, setDeletingClass] = useState<Kelas | null>(null);
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

  // States untuk Hapus Semua
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isCheckingRelations, setIsCheckingRelations] = useState(false);
  const [relationAudit, setRelationAudit] = useState<RelationAuditResult | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const defaultTitleRef = useRef<string>("Kelola Ruang Kelas | Admin Sistem Absensi");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;
  const [previewScale, setPreviewScale] = useState(0.5);
  const [logoBase64, setLogoBase64] = useState<string>("");

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const b64 = await getLogoBase64();
        if (b64) {
          setLogoBase64(b64);
          return;
        }
      } catch (err) {
        console.warn("Gagal load logo dari server action, mencoba fallback browser fetch:", err);
      }

      try {
        const res = await fetch("/Logo.png");
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              setLogoBase64(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        }
      } catch (fetchErr) {
        console.error("Gagal load logo via fetch:", fetchErr);
      }
    };

    loadLogo();
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (typeof window !== "undefined") {
        // A4 height in pixels at 96 DPI is approx 1123px. Add some padding.
        const targetHeight = window.innerHeight * 0.60;
        const newScale = targetHeight / 1150;
        setPreviewScale(Math.min(newScale, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Tutup dropdown filter saat user klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelas]); 
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

  const filteredKelas = kelasList.filter((k) => {
    const query = searchQuery.trim().toLowerCase();
    const nama = (k.nama_kelas || "").trim().toLowerCase();

    if (query && !nama.includes(query)) {
      return false;
    }

    if (filterKelas === "all") return true;

    if (filterKelas === "7") {
      return (
        /\b(7|vii)\b/i.test(nama) ||
        /^(kelas\s*)?(7|vii)[\s\-_a-z0-9]/i.test(nama) ||
        /^(kelas\s*)?(7|vii)$/i.test(nama)
      );
    }
    if (filterKelas === "8") {
      return (
        /\b(8|viii)\b/i.test(nama) ||
        /^(kelas\s*)?(8|viii)[\s\-_a-z0-9]/i.test(nama) ||
        /^(kelas\s*)?(8|viii)$/i.test(nama)
      );
    }
    if (filterKelas === "9") {
      return (
        /\b(9|ix)\b/i.test(nama) ||
        /^(kelas\s*)?(9|ix)[\s\-_a-z0-9]/i.test(nama) ||
        /^(kelas\s*)?(9|ix)$/i.test(nama)
      );
    }

    return true;
  });

  useEffect(() => {
    if (typeof document !== "undefined" && document.title) {
      defaultTitleRef.current = document.title;
    }
  }, []);

  const handlePrintQR = () => {
    if (!selectedClass) return;
    const cleanClassName = selectedClass.nama_kelas
      .trim()
      .replace(/^kelas\s*/i, "")
      .replace(/\s+/g, "_");
    document.title = `Qr_kelas_${cleanClassName}`;
    window.print();
  };

  const handlePrintAllQR = () => {
    if (isPreparingPrint) return;
    document.title = "Qr_Seluruh_Kelas";
    setIsPreparingPrint(true);
    setIsPrintingAll(true);

    // Beri waktu 500ms agar seluruh QR SVG & DOM selesai dirender sebelum dialog cetak browser muncul
    setTimeout(() => {
      setIsPreparingPrint(false);
      window.print();
    }, 500);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingAll(false);
      setIsPreparingPrint(false);
      if (typeof document !== "undefined") {
        document.title = defaultTitleRef.current;
      }
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const normalizedName = createName.trim();
    if (!normalizedName) return;

    const isDuplicate = kelasList.some(
      (k) => k.nama_kelas.toLowerCase() === normalizedName.toLowerCase()
    );

    if (isDuplicate) {
      setCreateError(`Kelas dengan nama "${normalizedName}" sudah ada!`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await createKelas({ nama_kelas: normalizedName });
      if (res.success) {
        setCreateMode(false);
        setCreateName("");
        setCreateError("");
        loadData();
      } else {
        setCreateError("Gagal menambah kelas: " + res.error);
      }
    } catch (err: any) {
      setCreateError("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    const normalizedName = editName.trim();
    if (!editingClass || !normalizedName) return;

    const isDuplicate = kelasList.some(
      (k) => k.id !== editingClass.id && k.nama_kelas.toLowerCase() === normalizedName.toLowerCase()
    );

    if (isDuplicate) {
      setEditError(`Kelas dengan nama "${normalizedName}" sudah ada!`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateKelas(editingClass.id, { nama_kelas: normalizedName });
      if (res.success) {
        setEditingClass(null);
        setEditName("");
        setEditError("");
        loadData();
      } else {
        setEditError("Gagal update kelas: " + res.error);
      }
    } catch (err: any) {
      setEditError("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    try {
      setSubmitting(true);
      setSingleDeleteError(null);
      const res = await deleteKelas(deletingClass.id);
      if (res.success) {
        setDeletingClass(null);
        loadData();
      } else {
        setSingleDeleteError(res.error || "Gagal menghapus kelas.");
      }
    } catch (err: any) {
      setSingleDeleteError(err.message || "Error saat menghapus kelas.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteAll = async () => {
    setIsDeleteAllOpen(true);
    setIsCheckingRelations(true);
    setRelationAudit(null);
    try {
      const audit = await checkKelasRelations();
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
      const res = await deleteAllKelas(forceCascade);
      if (res.success) {
        setIsDeleteAllOpen(false);
        loadData();
      } else {
        alert("Gagal menghapus seluruh kelas: " + (res.error || ""));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsDeletingAll(false);
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
    <>
    <div className="space-y-8 print:hidden">
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

        <ClockBadges />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Cari nama kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f4f9] text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border border-transparent transition-all"
            />
          </div>

          {/* Button Filter Dropdown */}
          <div className="relative w-full sm:w-auto" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-between sm:justify-start gap-2.5 transition-all cursor-pointer whitespace-nowrap min-w-[145px] ${
                filterKelas !== "all"
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                  : "bg-[#f0f4f9] border-transparent text-slate-700 hover:bg-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter className={`w-4 h-4 ${filterKelas !== "all" ? "text-blue-600" : "text-slate-500"}`} />
                <span>
                  {filterKelas === "all" ? "Semua Kelas" : `Kelas ${filterKelas}`}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isFilterDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full sm:w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in slide-in-from-top-1">
                {[
                  { value: "all", label: "Semua Kelas" },
                  { value: "7", label: "Kelas 7" },
                  { value: "8", label: "Kelas 8" },
                  { value: "9", label: "Kelas 9" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilterKelas(option.value as "all" | "7" | "8" | "9");
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      filterKelas === option.value
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 self-start lg:self-auto w-full lg:w-auto">
          <button
            onClick={handlePrintAllQR}
            disabled={isPreparingPrint}
            className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-sm font-semibold text-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Printer className={`w-4 h-4 ${isPreparingPrint ? "animate-spin" : ""}`} />
            <span>{isPreparingPrint ? "Menyiapkan Dokumen..." : "Cetak Semua QR"}</span>
          </button>
          <button
            onClick={() => { setCreateMode(true); setCreateError(""); setCreateName(""); }}
            className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Tambah Kelas</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDeleteAll}
            disabled={kelasList.length === 0}
            className="px-4 py-2.5 w-full sm:w-auto rounded-xl border border-red-200/90 bg-red-50 hover:bg-red-100 active:scale-[0.98] text-sm font-semibold text-red-600 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua</span>
          </button>
        </div>
      </div>


      {/* Table & Mobile Card List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm">
        {/* Mobile View (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredKelas.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium text-sm">
              {searchQuery || filterKelas !== "all"
                ? "Tidak ada ruang kelas yang cocok dengan filter atau pencarian."
                : "Belum ada ruang kelas."}
            </div>
          ) : (
            paginatedList.map((kelas) => (
              <div
                key={kelas.id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="text-sm font-semibold text-slate-800 truncate pr-1">
                  {kelas.nama_kelas}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    onClick={() => setSelectedClass(kelas)}
                    className="bg-blue-600 hover:bg-blue-700 font-semibold px-3 py-1.5 text-xs h-auto"
                  >
                    Lihat QR
                  </Button>
                  <button
                    onClick={() => {
                      setEditingClass(kelas);
                      setEditName(kelas.nama_kelas);
                      setEditError("");
                    }}
                    className="text-slate-400 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Edit Kelas"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingClass(kelas)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= sm) */}
        <table className="hidden sm:table w-full text-left border-collapse">
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
                  {searchQuery || filterKelas !== "all"
                    ? "Tidak ada ruang kelas yang cocok dengan filter atau pencarian."
                    : "Belum ada ruang kelas."}
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
                          setEditError("");
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
      <Modal isOpen={!!selectedClass} onClose={() => setSelectedClass(null)} maxWidth="max-w-4xl">
        {selectedClass && (
          <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pratinjau Lembar A4 QR Code</h2>
                <p className="text-sm text-slate-500 mt-1">Standar ISO 216 (210 x 297 mm) - Siap cetak & tempel pintu kelas</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setSelectedClass(null)} fullWidth={false} className="flex-1 sm:flex-none">
                  Batal
                </Button>
                <Button variant="primary" onClick={handlePrintQR} fullWidth={false} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 px-6">
                  <Printer className="w-4 h-4" /> Cetak Dokumen Resmi (A4)
                </Button>
              </div>
            </div>

            {/* Preview Container - Dynamically scaled to fit exactly within 60vh */}
            <div className="bg-slate-100 rounded-2xl flex justify-center items-center overflow-hidden border border-slate-200/60 shadow-inner w-full relative h-[60vh]">
               <div className="print:static print:transform-none" style={{ transform: `scale(${previewScale})`, transformOrigin: "center" }}>
                 <ClassA4PrintTemplate classData={selectedClass} logoBase64={logoBase64} />
               </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah Kelas */}
      <Modal isOpen={createMode} onClose={() => { setCreateMode(false); setCreateError(""); setCreateName(""); }} maxWidth="max-w-[400px]">
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
              onChange={(e) => { setCreateName(e.target.value); setCreateError(""); }}
              required
              autoComplete="off"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 outline-none focus:ring-2 transition-all bg-white ${createError ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
            />
            {createError && (
              <span className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
                {createError}
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setCreateMode(false); setCreateError(""); setCreateName(""); }}
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
      <Modal isOpen={!!editingClass} onClose={() => { setEditingClass(null); setEditError(""); }} maxWidth="max-w-[400px]">
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
              onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
              required
              autoComplete="off"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 outline-none focus:ring-2 transition-all bg-white ${editError ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`}
            />
            {editError && (
              <span className="text-xs font-semibold text-red-500 mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
                {editError}
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setEditingClass(null); setEditError(""); }}
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

      {/* Modal Hapus Satu Kelas */}
      <DeleteSingleModal
        isOpen={!!deletingClass}
        onClose={() => {
          setDeletingClass(null);
          setSingleDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Ruang Kelas"
        itemName={deletingClass?.nama_kelas}
        isDeleting={submitting}
        errorRelation={singleDeleteError}
        onClearError={() => setSingleDeleteError(null)}
      />

      {/* Modal Hapus Semua Kelas */}
      <DeleteAllModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Hapus Semua Ruang Kelas"
        entityName="ruang kelas"
        totalCount={kelasList.length}
        isChecking={isCheckingRelations}
        relationInfo={relationAudit}
        isDeleting={isDeletingAll}
      />
    </div>

    {/* Print-only template */}
    <div className="hidden print:block w-full h-full bg-white">
      {isPrintingAll 
        ? kelasList.map((kelas) => <ClassA4PrintTemplate key={kelas.id} classData={kelas} logoBase64={logoBase64} />)
        : (selectedClass && <ClassA4PrintTemplate classData={selectedClass} logoBase64={logoBase64} />)
      }
    </div>
    </>
  );
}

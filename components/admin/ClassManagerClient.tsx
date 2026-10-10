"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Printer } from "lucide-react";
import { Kelas } from "@/types/schema";
import { getKelasList, createKelas, updateKelas, deleteKelas } from "@/actions/kelas";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";
import { Modal } from "./ui/Modal";
import { Button } from "../ui/button";
import Pagination from "@/components/ui/pagination";

const A4Template = ({ classData }: { classData: Kelas }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const qrUrl = `${cleanBaseUrl}/absen-qr/${classData.kode_qr || classData.id}`;
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const academicYear = `${startYear}/${startYear + 1}`;
  
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthName = months[currentMonth];
  const printDate = `${currentMonthName} ${currentYear}`;

  return (
    <div className="w-[210mm] h-[296mm] bg-white text-black p-10 flex flex-col relative box-border mx-auto border border-slate-200 print:border-none shadow-sm print:shadow-none overflow-hidden print:w-[210mm] print:h-[296mm] print:overflow-hidden page-break-inside-avoid print:break-after-page">
      {/* Outer border for the A4 paper content */}
      <div className="absolute inset-2 border border-slate-800 pointer-events-none rounded-sm"></div>
      <div className="absolute inset-3 border border-slate-800 pointer-events-none rounded-sm"></div>

      <div className="relative z-10 flex flex-col h-full px-8 py-8">
        {/* Kop Surat */}
        <div className="flex items-center justify-between border-b-[3px] border-slate-800 pb-6 mb-8 w-full px-4">
          <div className="flex-shrink-0">
            <img src="/Logo.png" alt="Logo" className="w-[100px] h-[100px] object-contain" />
          </div>
          <div className="text-center flex-1 px-6">
            <h4 className="text-sm font-bold text-slate-700 tracking-wider">PEMERINTAH KABUPATEN KARAWANG</h4>
            <h2 className="text-2xl font-black text-slate-900 tracking-widest mt-1">SMP NEGERI 8 KARAWANG BARAT</h2>
            <p className="text-xs text-slate-600 mt-2">Jl. Karangpawitan, Karawang Barat, Jawa Barat - TA {academicYear}</p>
          </div>
          <div className="w-[100px] flex-shrink-0"></div> {/* Spacer to keep the text perfectly centered */}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center flex-1">
          <div className="px-6 py-2 rounded-full border border-slate-300 bg-slate-50 text-xs font-bold text-slate-600 tracking-widest mb-6 text-center">
            PAPAN IDENTITAS & PRESENSI KBM DIGITAL
          </div>
          
          <h1 className="text-[40px] font-black text-slate-900 uppercase tracking-wider text-center">
            {classData.nama_kelas}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 text-center">
            Tahun Ajaran {academicYear}
          </p>

          <div className="mt-12 p-4 border-[3px] border-slate-200 rounded-3xl bg-white shadow-sm">
             <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrUrl)}`}
                alt={`QR Code ${classData.nama_kelas}`}
                className="w-64 h-64 object-contain mix-blend-multiply"
             />
          </div>

          <div className="mt-6 px-6 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 font-mono tracking-wider">
             QR-RUANG-{(classData.kode_qr || classData.id).toString().slice(0,8).toUpperCase()}
          </div>

          {/* Instructions */}
          <div className="mt-auto pt-10 w-full">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-700">
               <h5 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  Petunjuk Presensi Guru Pengajar:
               </h5>
               <ol className="list-decimal list-inside space-y-2 text-slate-600 font-medium ml-1">
                  <li>Buka aplikasi kamera bawaan ponsel Anda, atau gunakan menu <strong className="text-slate-800">Absensi Mengajar</strong> di dalam aplikasi guru.</li>
                  <li>Arahkan kamera untuk memindai QR Code di atas. Pastikan Anda sudah memberi izin akses lokasi (GPS).</li>
                  <li>Sistem akan otomatis mencocokkan jadwal dan memverifikasi kehadiran mengajar Anda.</li>
               </ol>
            </div>
          </div>

          {/* Empty spacer so the layout still stretches nicely if needed, or we just rely on flex */}
          <div className="w-full flex justify-end mt-12 mb-4">
             {/* Signature section removed per user request */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClassManagerClient() {

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Kelas | null>(null);

  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [editingClass, setEditingClass] = useState<Kelas | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingClass, setDeletingClass] = useState<Kelas | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const { timeString, dateString } = useRealtimeClock();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;
  const [previewScale, setPreviewScale] = useState(0.5);

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
    window.print();
  };

  const handlePrintAllQR = () => {
    setIsPrintingAll(true);
    // Beri waktu 500ms agar DOM sempat merender semua gambar QR sebelum dialog print muncul
    setTimeout(() => {
      window.print();
      setIsPrintingAll(false);
    }, 500);
  };

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
        <div className="flex flex-col sm:flex-row items-center gap-3 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={handlePrintAllQR}
            className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-sm font-semibold text-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Semua QR</span>
          </button>
          <button
            onClick={() => { setCreateMode(true); setCreateError(""); setCreateName(""); }}
            className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>+</span>
            <span>Tambah Kelas</span>
          </button>
        </div>
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
                 <A4Template classData={selectedClass} />
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

    {/* Print-only template */}
    <div className="hidden print:block w-full h-full bg-white">
      {isPrintingAll 
        ? kelasList.map((kelas) => <A4Template key={kelas.id} classData={kelas} />)
        : (selectedClass && <A4Template classData={selectedClass} />)
      }
    </div>
    </>
  );
}

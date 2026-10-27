import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Guru } from "@/types/schema";
import { LaporanKehadiran, LaporanMengajar } from "@/actions/laporan";
import { getStatusColorText } from "@/lib/status";
import { PhotoOverlay } from "./PhotoOverlay";

function formatShortDateRange(startStr: string, endStr: string, defaultLabel: string): string {
  if (!startStr || !endStr) return defaultLabel;
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return defaultLabel;

    const startDay = String(s.getDate()).padStart(2, "0");
    const endDay = String(e.getDate()).padStart(2, "0");
    
    const startMonth = s.toLocaleDateString("id-ID", { month: "short" });
    const endMonth = e.toLocaleDateString("id-ID", { month: "short" });
    const startYear = s.getFullYear();
    const endYear = e.getFullYear();

    if (startYear === endYear && startMonth === endMonth) {
      return `${startDay}–${endDay} ${endMonth} ${endYear}`;
    } else if (startYear === endYear) {
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
    } else {
      return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
    }
  } catch {
    return defaultLabel;
  }
}

export function LaporanDetailModal({
  type = "kehadiran",
  detailModalGuruId,
  guruList,
  laporanKehadiran,
  laporanMengajar = [],
  startDate,
  endDate,
  onClose,
  formatDateLabel,
  onPreviewPhoto,
}: {
  type?: "kehadiran" | "mengajar";
  detailModalGuruId: string;
  guruList: Guru[];
  laporanKehadiran: LaporanKehadiran[];
  laporanMengajar?: LaporanMengajar[];
  startDate: string;
  endDate: string;
  onClose: () => void;
  formatDateLabel: (d: string) => string;
  onPreviewPhoto?: (url: string) => void;
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const detailGuru = guruList.find((g) => g.id === detailModalGuruId);

  // ── Mode Mengajar ───────────────────────────────────────────
  if (type === "mengajar") {
    const detailMengajarList = laporanMengajar.filter((r) => r.guru_id === detailModalGuruId);
    const detailMengajar = detailMengajarList.filter((r) => r.status.toLowerCase() === "mengajar").length;
    const detailTidakMengajar = detailMengajarList.filter(
      (r) => r.status.toLowerCase().includes("tidak") || r.status === "—" || r.status === "-"
    ).length;
    const totalCatatanMengajar = detailMengajarList.length;
    const persentaseMengajar =
      totalCatatanMengajar > 0 ? Math.round((detailMengajar / totalCatatanMengajar) * 100) : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="p-6 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{detailGuru?.nama || "-"}</h2>
              <p className="text-sm text-slate-400 mt-1 font-medium">NIP {detailGuru?.nip || "-"}</p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 pt-0 space-y-6">
            
            {/* Stats Section Mengajar */}
            <div className="border border-slate-200/80 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900">Absensi mengajar selama periode</h3>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {formatShortDateRange(startDate, endDate, `${formatDateLabel(startDate)} hingga ${formatDateLabel(endDate)}`)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                {/* Circle Progress */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeDasharray={`${persentaseMengajar}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600 tracking-tight">{persentaseMengajar}%</span>
                    <span className="text-xs font-medium text-slate-500">Mengajar</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 w-full grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="border border-blue-100/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                    <p className="text-xs font-medium text-slate-500">Mengajar</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 tracking-tight">{detailMengajar}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-normal">tercatat</p>
                  </div>
                  <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                    <p className="text-xs font-medium text-slate-500">Tidak mengajar</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">{detailTidakMengajar}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-normal">tercatat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Detail Mengajar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900">Detail catatan mengajar</h3>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">{totalCatatanMengajar} catatan</span>
              </div>
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-slate-100">
                      <tr className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                        <th className="py-3 px-4 sm:px-6 w-[25%] font-bold">TANGGAL</th>
                        <th className="py-3 px-4 sm:px-6 w-[38%] font-bold">KELAS / MATA PELAJARAN</th>
                        <th className="py-3 px-4 sm:px-6 w-[17%] font-bold">WAKTU</th>
                        <th className="py-3 px-4 sm:px-6 w-[20%] font-bold">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailMengajarList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada catatan mengajar</td>
                        </tr>
                      ) : (
                        detailMengajarList.map((r) => {
                          const isMengajar = r.status.toLowerCase() === "mengajar";
                          const displayWaktu = r.waktu ? (r.waktu.includes(" - ") ? r.waktu.split(" - ")[0] : r.waktu) : "—";
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 sm:py-3.5 px-4 sm:px-6 font-semibold text-slate-900">{r.tanggal}</td>
                              <td className="py-3 sm:py-3.5 px-4 sm:px-6 text-slate-600 font-medium">
                                {r.kelas} / {r.mata_pelajaran}
                              </td>
                              <td className="py-3 sm:py-3.5 px-4 sm:px-6 text-slate-600 font-medium" title={r.waktu}>
                                {displayWaktu}
                              </td>
                              <td className="py-3 sm:py-3.5 px-4 sm:px-6">
                                <span className={`font-semibold ${isMengajar ? "text-blue-600" : getStatusColorText(r.status)}`}>
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  // ── Mode Kehadiran (Default) ────────────────────────────────
  const detailKehadiran = laporanKehadiran.filter((r) => r.guru_id === detailModalGuruId);
  const detailHadir = detailKehadiran.filter((r) => r.status.toLowerCase() === "hadir").length;
  const detailSakit = detailKehadiran.filter((r) => r.status.toLowerCase() === "sakit").length;
  const detailIzin = detailKehadiran.filter((r) => r.status.toLowerCase() === "izin").length;
  const detailDinasLuar = detailKehadiran.filter((r) => r.status.toLowerCase() === "dinas").length;
  const detailTidakHadir = detailKehadiran.filter((r) => r.status.toLowerCase().includes("tidak")).length;
  const totalCatatan = detailKehadiran.length;
  const persentaseHadir = totalCatatan > 0 ? Math.round((detailHadir / totalCatatan) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{detailGuru?.nama || "-"}</h2>
            <p className="text-sm text-slate-500 mt-1">NIP/NUPTK {detailGuru?.nip || "-"}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-0 space-y-6">
          
          {/* Stats Section */}
          <div className="border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-900">Kehadiran selama periode</h3>
              <span className="text-sm text-slate-500">{formatDateLabel(startDate)} hingga {formatDateLabel(endDate)}</span>
            </div>
            
            <div className="flex items-center gap-6 md:gap-10">
              {/* Circle Progress */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeDasharray={`${persentaseHadir}, 100`}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">{persentaseHadir}%</span>
                  <span className="text-[10px] font-medium text-slate-500">Hadir</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 flex gap-2 md:gap-4 overflow-x-auto pb-2">
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Hadir</p>
                  <p className="text-xl font-bold text-blue-600">{detailHadir}</p>
                  <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                </div>
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Sakit</p>
                  <p className="text-xl font-bold text-rose-500">{detailSakit}</p>
                  <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                </div>
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Izin</p>
                  <p className="text-xl font-bold text-orange-500">{detailIzin}</p>
                  <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                </div>
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Dinas luar</p>
                  <p className="text-xl font-bold text-teal-500">{detailDinasLuar}</p>
                  <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                </div>
                <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex-1 min-w-[80px] text-center">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Tidak hadir</p>
                  <p className="text-xl font-bold text-purple-600">{detailTidakHadir}</p>
                  <p className="text-[10px] text-slate-400 mt-1">tercatat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Detail */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-100">
              <h3 className="text-[15px] font-bold text-slate-900">Detail catatan kehadiran</h3>
              <span className="text-sm text-slate-500">{totalCatatan} catatan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-2.5 sm:py-3 px-3 sm:px-5 w-[22%]">TANGGAL</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-5 w-[14%] text-center">FOTO</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-5 w-[22%]">JAM MASUK</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-5 w-[18%]">JAM PULANG</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-5 w-[24%]">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailKehadiran.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">Belum ada catatan</td>
                    </tr>
                  ) : (
                    detailKehadiran.map((r) => {
                      const photoUrl = r.foto_absensi || r.file_bukti_izin_sakit;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 sm:py-3 px-3 sm:px-5 font-semibold text-slate-800">{r.tanggal}</td>
                          <td className="py-2 sm:py-3 px-3 sm:px-5 text-center">
                            {photoUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onPreviewPhoto) {
                                    onPreviewPhoto(photoUrl);
                                  } else {
                                    setSelectedPhoto(photoUrl);
                                  }
                                }}
                                className="inline-flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 rounded-lg p-1.5 hover:bg-blue-100 transition-colors active:scale-95 cursor-pointer"
                                title="Lihat Foto / Bukti"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-3 sm:px-5 text-slate-600 font-medium">{r.waktu_masuk || "—"}</td>
                          <td className="py-2 sm:py-3 px-3 sm:px-5 text-slate-400 font-medium">—</td>
                          <td className="py-2 sm:py-3 px-3 sm:px-5">
                            <span className={`font-semibold ${getStatusColorText(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>

      {/* Photo Overlay inside Modal */}
      {selectedPhoto && (
        <PhotoOverlay
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}

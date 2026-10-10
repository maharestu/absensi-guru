import React from "react";
import { Guru } from "@/types/schema";
import { LaporanKehadiran } from "@/actions/laporan";
import { getStatusColorText } from "@/lib/status";

export function LaporanDetailModal({
  detailModalGuruId,
  guruList,
  laporanKehadiran,
  startDate,
  endDate,
  onClose,
  formatDateLabel,
}: {
  detailModalGuruId: string;
  guruList: Guru[];
  laporanKehadiran: LaporanKehadiran[];
  startDate: string;
  endDate: string;
  onClose: () => void;
  formatDateLabel: (d: string) => string;
}) {
  const detailGuru = guruList.find(g => g.id === detailModalGuruId);
  const detailKehadiran = laporanKehadiran.filter(r => r.guru_id === detailModalGuruId);
  const detailHadir = detailKehadiran.filter(r => r.status.toLowerCase() === "hadir").length;
  const detailSakit = detailKehadiran.filter(r => r.status.toLowerCase() === "sakit").length;
  const detailIzin = detailKehadiran.filter(r => r.status.toLowerCase() === "izin").length;
  const detailDinasLuar = detailKehadiran.filter(r => r.status.toLowerCase() === "dinas").length;
  const detailTidakHadir = 0;
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
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
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
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50">
                  <tr className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-5 w-[30%]">TANGGAL</th>
                    <th className="py-3 px-5 w-[40%]">STATUS</th>
                    <th className="py-3 px-5 w-[30%]">WAKTU MASUK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailKehadiran.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500">Belum ada catatan</td>
                    </tr>
                  ) : (
                    detailKehadiran.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-5 font-semibold text-slate-800">{r.tanggal}</td>
                        <td className="py-3 px-5">
                          <span className={`font-semibold ${getStatusColorText(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-500 font-medium">{r.waktu_masuk}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Camera, Clock, User, BookOpen, AlertCircle, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { MonitoringKelasItem, SesiJadwalMonitoring } from "@/actions/monitoring";
import { PhotoOverlay } from "./PhotoOverlay";

interface MonitoringDetailModalProps {
  kelas: MonitoringKelasItem | null;
  onClose: () => void;
  hariLabel?: string;
  tanggalLabel?: string;
}

export function MonitoringDetailModal({
  kelas,
  onClose,
  hariLabel,
  tanggalLabel,
}: MonitoringDetailModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!kelas) return null;

  const sesi = kelas.sesiAktif;
  const isDigunakan = kelas.statusRuang === "sedang_digunakan";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
          
          {/* Header Modal */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">{kelas.namaKelas}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isDigunakan 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isDigunakan ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  {kelas.statusRuangLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{hariLabel ? `${hariLabel}, ${tanggalLabel || ""}` : "Informasi Kegiatan Belajar Mengajar"}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-2xs"
              aria-label="Tutup modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Isi Konten Modal */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
            
            {/* Section 1: Detail Kegiatan Saat Ini */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Kondisi Kelas Saat Ini
              </h3>

              {isDigunakan && sesi ? (
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                        Mata Pelajaran
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                        {sesi.mataPelajaran}
                      </h4>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-blue-700 text-xs sm:text-sm font-semibold shadow-2xs self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sesi.jamMulai} – {sesi.jamSelesai} WIB</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* Guru */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Guru Pengajar</p>
                        <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{sesi.guruNama}</p>
                        <p className="text-xs text-slate-400">NIP: {sesi.guruNip || "—"}</p>
                      </div>
                    </div>

                    {/* Status Presensi */}
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        sesi.statusPresensi === "sudah_presensi"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : sesi.statusPresensi === "tidak_mengajar"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                        {sesi.statusPresensi === "sudah_presensi" && <CheckCircle2 className="w-4 h-4" />}
                        {sesi.statusPresensi === "tidak_mengajar" && <XCircle className="w-4 h-4" />}
                        {sesi.statusPresensi === "belum_presensi" && <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Status Presensi</p>
                        <p className={`text-sm font-semibold mt-0.5 ${
                          sesi.statusPresensi === "sudah_presensi"
                            ? "text-emerald-700"
                            : sesi.statusPresensi === "tidak_mengajar"
                            ? "text-rose-700"
                            : "text-amber-700"
                        }`}>
                          {sesi.statusPresensiLabel}
                        </p>
                        <p className="text-xs text-slate-400">
                          {sesi.waktuSubmit ? `Pukul ${sesi.waktuSubmit} WIB` : "Belum ada catatan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Foto Presensi jika tersedia */}
                  {sesi.fotoAbsensi && (
                    <div className="pt-2.5 flex items-center justify-between border-t border-slate-200/60">
                      <span className="text-xs text-slate-500 font-medium">
                        Dokumentasi Mengajar
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(sesi.fotoAbsensi || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Lihat Foto</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50/70 rounded-2xl p-5 text-center border border-slate-200/80">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-700">Tidak Ada KBM yang Sedang Berlangsung</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ruang kelas saat ini berstatus kosong.
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Seluruh Jadwal Kelas Hari Ini */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Jadwal Hari Ini ({kelas.seluruhSesiHariIni.length} Sesi)
                </h3>
              </div>

              {kelas.seluruhSesiHariIni.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Tidak ada jadwal KBM yang terdaftar di ruang kelas ini hari ini.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {kelas.seluruhSesiHariIni.map((item, idx) => {
                    const isCurrent = isDigunakan && sesi?.jadwalId === item.jadwalId;

                    return (
                      <div
                        key={item.jadwalId || idx}
                        className={`p-3 sm:p-3.5 flex items-center justify-between text-xs transition-colors ${
                          isCurrent ? "bg-blue-50/60 font-medium" : "hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-semibold flex-shrink-0 ${
                            isCurrent
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {item.jamMulai} - {item.jamSelesai}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {item.mataPelajaran}
                            </p>
                            <p className="text-slate-500 text-[11px] truncate">
                              {item.guruNama}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-2 sm:ml-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.statusPresensi === "sudah_presensi"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.statusPresensi === "tidak_mengajar"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {item.statusPresensiLabel}
                          </span>
                          {item.fotoAbsensi && (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(item.fotoAbsensi || null)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Lihat foto presensi"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer Modal */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Foto Presensi jika diklik */}
      {selectedPhoto && (
        <PhotoOverlay
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}

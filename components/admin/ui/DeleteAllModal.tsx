"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export interface RelationAuditResult {
  hasRelations: boolean;
  details: string[];
  warningMessage?: string;
}

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (forceCascade: boolean) => Promise<void>;
  title: string;
  entityName: string;
  totalCount: number;
  isChecking?: boolean;
  relationInfo?: RelationAuditResult | null;
  isDeleting?: boolean;
}

export function DeleteAllModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  totalCount,
  isChecking = false,
  relationInfo = null,
  isDeleting = false,
}: DeleteAllModalProps) {
  const [showForceSection, setShowForceSection] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  // Reset internal state saat modal dibuka/tutup
  useEffect(() => {
    if (!isOpen) {
      setShowForceSection(false);
      setConfirmInput("");
    }
  }, [isOpen]);

  const handleExecute = (force: boolean) => {
    onConfirm(force);
  };

  const isForceConfirmed = confirmInput.trim().toUpperCase() === "HAPUS";

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      {isChecking ? (
        // State 1: Memeriksa Relasi Database
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Memeriksa Keterikatan Data...
            </h3>
            <p className="text-xs text-slate-500">
              Sedang mengaudit relasi foreign key pada tabel {entityName}.
            </p>
          </div>
        </div>
      ) : relationInfo?.hasRelations ? (
        // State 2: Data Terkunci oleh Foreign Key
        <div className="space-y-5 pt-1">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sebagian data masih terhubung dengan catatan di tabel lain.
              </p>
            </div>
          </div>

          {relationInfo.warningMessage && (
            <p className="text-[11.5px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 leading-relaxed">
              ⚠️ {relationInfo.warningMessage}
            </p>
          )}

          {/* Kotak Rincian Keterikatan */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 text-xs space-y-2.5">
            <p className="font-semibold text-amber-900">
              Ditemukan data yang masih menjadi acuan:
            </p>
            <ul className="space-y-1.5 text-amber-800 list-disc list-inside">
              {relationInfo.details.map((detail, idx) => (
                <li key={idx} className="leading-relaxed">
                  {detail}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
              Database mengunci penghapusan langsung demi mencegah inkonsistensi
              data.
            </p>
          </div>

          {!showForceSection ? (
            // Pilihan Default: Batal atau Opsi Paksa Hapus
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs"
                >
                  Batal & Pertahankan Data
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowForceSection(true)}
                className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all"
              >
                Opsi: Paksa Hapus Semua (Reset Bersih Beserta Riwayatnya)
              </button>
            </div>
          ) : (
            // Opsi Lanjutan: Konfirmasi Ganda Paksa Hapus
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Peringatan Penghapusan Menyeluruh (Cascade)</span>
              </div>
              <p className="text-[11.5px] text-red-600/90 leading-relaxed">
                Tindakan ini akan <strong>menghapus bersih</strong> seluruh data{" "}
                {entityName} serta seluruh riwayat jadwal, catatan absensi, dan
                bukti foto yang terhubung.
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Ketik kata <span className="text-red-600">&quot;HAPUS&quot;</span> untuk mengonfirmasi:
                </label>
                <input
                  type="text"
                  placeholder="Ketik HAPUS di sini..."
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-red-300 text-sm font-semibold text-red-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowForceSection(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={!isForceConfirmed || isDeleting}
                  onClick={() => handleExecute(true)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Ya, Paksa Hapus Semua</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // State 3: Data Bersih (Bisa Dihapus Normal)
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200/80 text-red-600 flex items-center justify-center shadow-xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Apakah Anda yakin ingin menghapus seluruh{" "}
              <span className="font-semibold text-slate-900">
                {totalCount} data {entityName}
              </span>
              ? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
            {relationInfo?.warningMessage && (
              <p className="text-[11.5px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 mt-2 leading-relaxed max-w-sm text-left">
                ⚠️ {relationInfo.warningMessage}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full pt-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => handleExecute(false)}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus Semua</span>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

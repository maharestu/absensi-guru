"use client";

import React from "react";
import { Modal } from "./Modal";
import { Trash2, AlertTriangle, ShieldAlert } from "lucide-react";

interface DeleteSingleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  isDeleting?: boolean;
  errorRelation?: string | null;
  onClearError?: () => void;
}

export function DeleteSingleModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isDeleting = false,
  errorRelation = null,
  onClearError,
}: DeleteSingleModalProps) {
  const handleClose = () => {
    if (onClearError) onClearError();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      {errorRelation ? (
        // State Gagal karena Relasi / Foreign Key
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">
              Data Tidak Dapat Dihapus
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              {errorRelation}
            </p>
          </div>

          <div className="w-full pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      ) : (
        // State Konfirmasi Hapus Normal
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200/80 text-red-600 flex items-center justify-center shadow-xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Apakah Anda yakin ingin menghapus{" "}
              {itemName ? (
                <span className="font-semibold text-slate-800">
                  &ldquo;{itemName}&rdquo;
                </span>
              ) : (
                "data ini"
              )}
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full pt-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-xs shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus</span>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

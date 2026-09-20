"use client";

import React, { useRef } from "react";

interface ImageUploaderProps {
  /** URL preview gambar yang sudah dipilih, atau null jika belum ada */
  previewUrl: string | null;
  /** Callback ketika user memilih file baru */
  onFileSelect: (file: File, previewUrl: string) => void;
  /** Teks hint format file */
  hint?: string;
}

/**
 * Komponen upload gambar reusable.
 *
 * Struktur dua lapisan (sesuai Figma):
 * ┌─────────────────────────────┐  ← Outer: white card dengan padding
 * │  ┌───────────────────────┐  │  ← Inner: gray dashed box
 * │  │    + Pilih foto ...   │  │
 * │  └───────────────────────┘  │
 * └─────────────────────────────┘
 *
 * Setelah ada gambar, inner box berubah menjadi preview gambar.
 */
export default function ImageUploader({
  previewUrl,
  onFileSelect,
  hint = "JPG / PNG • Maks. 5 MB",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ["image/jpeg", "image/png"].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5 MB

    if (!isValidType || !isValidSize) return;

    const url = URL.createObjectURL(file);
    onFileSelect(file, url);

    // Reset input supaya file yang sama bisa dipilih lagi
    e.target.value = "";
  };

  return (
    <>
      {/* Input file tersembunyi */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Pilih gambar"
      />

      {/* ── OUTER CARD (putih, rounded, shadow) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">

        {/* ── INNER BOX: tinggi statis h-56 = 224px, tidak berubah saat ada/tidak ada gambar ── */}
        <button
          type="button"
          onClick={handleClick}
          className="w-full h-56 rounded-xl overflow-hidden transition-all active:scale-[0.99] group focus:outline-none"
          aria-label="Upload gambar surat"
        >
          {previewUrl ? (
            /* ── STATE: Ada gambar → preview mengisi box dengan object-cover ── */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview surat"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            /* ── STATE: Belum ada gambar → empty state mengisi full height box ── */
            <div
              className="
                w-full h-full rounded-xl border border-slate-200
                bg-slate-50/80 flex flex-col items-center justify-center
                px-6 text-center
                group-hover:border-blue-300 group-hover:bg-blue-50/20
                transition-colors duration-150
              "
            >
              {/* Plus icon */}
              <div className="text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-150">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <path
                    d="M18 6V30M6 18H30"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Pilih atau ambil foto surat
              </p>
              <p className="text-xs text-slate-400 mt-1.5">{hint}</p>
            </div>
          )}
        </button>
      </div>
    </>
  );
}

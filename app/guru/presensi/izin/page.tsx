"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import ImageUploader from "@/components/ui/image-uploader";
import Button from "@/components/ui/button";

export default function IzinPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleFileSelect = (_file: File, url: string) => {
    setPreviewUrl(url);
    if (showError) setShowError(false);
  };

  const handleLanjutkan = async () => {
    if (!previewUrl || !keterangan.trim()) {
      setShowError(true);
      return;
    }

    setIsUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsUploading(false);

    router.push("/guru/presensi/verifikasi?status=izin");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/guru/pilih-status"
        title="Bukti Keterangan Izin"
        subtitle="Unggah foto surat izin yang jelas dan terbaca."
      />

      {/* Error Alert */}
      {showError && (
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12M12 16H12.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800">
            Salah satu field tidak boleh kosong.
          </span>
        </div>
      )}

      <ImageUploader
        previewUrl={previewUrl}
        onFileSelect={handleFileSelect}
        hint="JPG / PNG • Maks. 5 MB"
      />

      {previewUrl && (
        <p className="mt-2 text-xs text-slate-400 text-center">
          Ketuk gambar untuk mengganti foto
        </p>
      )}

      {/* Keterangan Tambahan */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Keterangan Tambahan
        </label>
        <textarea
          value={keterangan}
          onChange={(e) => {
            setKeterangan(e.target.value);
            if (showError) setShowError(false);
          }}
          placeholder="Masukkan keterangan tambahan"
          rows={4}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      <div className="mt-8">
        <Button onClick={handleLanjutkan} disabled={isUploading}>
          {isUploading ? "Memproses..." : "Lanjutkan"}
        </Button>
      </div>
    </div>
  );
}

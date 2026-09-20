"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import ImageUploader from "@/components/ui/image-uploader";

export default function SakitPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (_file: File, url: string) => {
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsUploading(false);

    router.push("/absensi/verifikasi?status=sakit");
  };

  const hasImage = !!previewUrl;

  return (
    /* flex-col full height → tombol didorong ke bawah dengan mt-auto */
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">

      <PageHeader
        backHref="/dashboard"
        title="Bukti Keterangan Sakit"
        subtitle="Unggah foto surat keterangan sakit yang jelas dan terbaca."
      />

      {/* Area Upload — tidak flex-1 agar tingginya natural */}
      <ImageUploader
        previewUrl={previewUrl}
        onFileSelect={handleFileSelect}
        hint="JPG / PNG • Maks. 5 MB"
      />

      {hasImage && (
        <p className="mt-2 text-xs text-slate-400 text-center">
          Ketuk gambar untuk mengganti foto
        </p>
      )}

      {/* mt-8 → tombol tepat di bawah kotak upload */}
      <div className="mt-8">
        <button
          onClick={handleUpload}
          disabled={!hasImage || isUploading}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200
            ${hasImage
              ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-md shadow-blue-200"
              : "bg-blue-600/40 text-white/70 cursor-not-allowed"
            }
          `}
        >
          {isUploading ? "Mengunggah..." : "Upload Surat"}
        </button>
      </div>
    </div>
  );
}

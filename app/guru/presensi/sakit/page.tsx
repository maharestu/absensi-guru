"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import ImageUploader from "@/components/ui/image-uploader";
import Button from "@/components/ui/button";

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

    router.push("/guru/presensi/verifikasi?status=sakit");
  };

  const hasImage = !!previewUrl;

  return (
    <div className="flex flex-col min-h-screen bg-[#EEF2F7] px-6 pt-12 pb-10">
      <PageHeader
        backHref="/guru/pilih-status"
        title="Bukti Keterangan Sakit"
        subtitle="Unggah foto surat keterangan sakit yang jelas dan terbaca."
      />

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

      <div className="mt-8">
        <Button
          onClick={handleUpload}
          disabled={!hasImage || isUploading}
        >
          {isUploading ? "Mengunggah..." : "Upload Surat"}
        </Button>
      </div>
    </div>
  );
}

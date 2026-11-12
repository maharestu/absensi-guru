import React from "react";
import FullScreenLoader from "@/components/ui/full-screen-loader";

export default function PengaturanLoading() {
  return (
    <FullScreenLoader
      message="Memuat pengaturan sistem..."
      bgClass="bg-[#f8fafc]"
    />
  );
}

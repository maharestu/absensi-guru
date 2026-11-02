import React from "react";
import FullScreenLoader from "@/components/ui/full-screen-loader";

export default function GuruLoading() {
  return (
    <FullScreenLoader
      message="Memuat halaman..."
      bgClass="bg-[#EEF2F7]"
    />
  );
}

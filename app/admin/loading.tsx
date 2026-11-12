import React from "react";
import FullScreenLoader from "@/components/ui/full-screen-loader";

export default function AdminLoading() {
  return (
    <FullScreenLoader
      message="Memuat halaman..."
      bgClass="bg-[#f8fafc]"
    />
  );
}

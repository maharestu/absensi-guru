import React from "react";
import ClassManagerClient from "@/components/admin/ClassManagerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Ruang Kelas | Admin Sistem Absensi",
  description: "Lihat data ruang kelas dan QR Code untuk absensi.",
};

export default function KelolaKelasPage() {
  return <ClassManagerClient />;
}

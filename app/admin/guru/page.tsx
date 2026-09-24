import React from "react";
import TeacherManagerClient from "@/components/admin/TeacherManagerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Data Guru | Admin Sistem Absensi",
  description: "Tambah, lihat, dan perbarui data guru sekolah.",
};

export default function KelolaGuruPage() {
  return <TeacherManagerClient />;
}

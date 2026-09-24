import React from "react";
import ScheduleManagerClient from "@/components/admin/ScheduleManagerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Jadwal | Admin Sistem Absensi",
  description: "Tambah, lihat, dan perbarui data jadwal mengajar sekolah.",
};

export default function KelolaJadwalPage() {
  return <ScheduleManagerClient />;
}

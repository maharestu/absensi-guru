import React from "react";
import AccountManagerClient from "@/components/admin/AccountManagerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Akun | Admin Sistem Absensi",
  description: "Tambah, lihat, dan perbarui data akun pengguna sekolah.",
};

export default function KelolaAkunPage() {
  return <AccountManagerClient />;
}

import React from "react";
import ImportDataClient from "@/components/admin/ImportDataClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Data | Admin Sistem Absensi",
  description: "Import data masal menggunakan Excel.",
};

export default function ImportPage() {
  return <ImportDataClient />;
}

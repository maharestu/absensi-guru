import { StatusAbsensiMasuk } from "@/types/schema";

export const STATUS_MASUK: StatusAbsensiMasuk[] = ["hadir", "izin", "sakit", "dinas"];

export const STATUS_MASUK_LABEL: Record<StatusAbsensiMasuk, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  dinas: "Dinas Keluar",
};

export const STATUS_AKTIVITAS_LABEL: Record<StatusAbsensiMasuk, string> = {
  hadir: "Presensi Masuk",
  izin: "Pengajuan Izin",
  sakit: "Pengajuan Sakit",
  dinas: "Dinas Keluar",
};

export const getStatusColorText = (status: string) => {
  const s = status.toLowerCase();
  if (s === "hadir" || s === "mengajar") return "text-blue-600";
  if (s === "izin") return "text-orange-500";
  if (s === "sakit") return "text-rose-500";
  if (s.includes("dinas")) return "text-teal-500";
  if (s.includes("tidak")) return "text-purple-600";
  return "text-slate-600";
};

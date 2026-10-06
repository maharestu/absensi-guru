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

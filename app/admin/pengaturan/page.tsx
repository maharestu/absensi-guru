import { getPengaturanSistem, getLokasiSekolah, getHariLibur } from "@/actions/pengaturan";
import PengaturanClient from "@/components/admin/PengaturanClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Pengaturan | Admin",
  description: "Konfigurasi sistem absensi: hari libur, waktu, toleransi, dan lokasi sekolah.",
};

export default async function PengaturanPage() {
  // Ambil semua data pengaturan secara paralel
  const [pengaturanSistem, hariLiburList, lokasiSekolah] = await Promise.allSettled([
    getPengaturanSistem(),
    getHariLibur(),
    getLokasiSekolah(),
  ]);

  const sistemData = pengaturanSistem.status === "fulfilled"
    ? pengaturanSistem.value
    : { jam_masuk: "07:00", jam_cutoff: "16:00", toleransi_menit: 5 };

  const hariLiburData = hariLiburList.status === "fulfilled"
    ? hariLiburList.value
    : [];

  const lokasiData = lokasiSekolah.status === "fulfilled"
    ? lokasiSekolah.value
    : { latitude: 0, longitude: 0, radius_meter: 100 };

  return (
    <PengaturanClient
      pengaturanSistem={sistemData}
      hariLibur={hariLiburData}
      lokasiSekolah={lokasiData}
    />
  );
}

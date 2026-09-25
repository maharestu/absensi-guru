/**
 * KEPSEK (KEPALA SEKOLAH) TYPES
 *
 * Tipe data untuk dashboard Kepala Sekolah.
 */

export interface KehadiranHariIni {
  id: string;
  nama_guru: string;
  waktu_masuk: string | null; // null jika Izin/Sakit/Belum Absen
  status: "Hadir" | "Izin" | "Sakit" | "Belum Absen";
}

export interface MengajarHariIni {
  id: string;
  nama_guru: string;
  mata_pelajaran: string;
  kelas: string;
  jam_mengajar: string;
  status: "Mengajar" | "Belum Mengajar";
}

export interface KepsekStats {
  guruHadir: number;
  izin: number;
  sakit: number;
  belumAbsen: number;
}

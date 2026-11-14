"use server";

/**
 * SERVER ACTIONS — MONITORING KELAS
 * Real-time monitoring keterisian dan kegiatan belajar di seluruh ruang kelas untuk Kepala Sekolah.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/session";
import {
  getTodayWIB,
  getHariWIB,
  getJamWIB,
  formatJamWIB,
  isWeekendWIB,
} from "@/lib/date";
import { getStatusOperasionalHariIni } from "@/actions/pengaturan";
import { getDevTestingConfigServer } from "@/lib/testing-mode";
import { isWaktuDalamJadwal, ekstrakTingkatKelas } from "@/lib/monitoring";

export type StatusRuangKelas = "sedang_digunakan" | "kosong";
export type StatusPresensiMengajar = "sudah_presensi" | "belum_presensi" | "tidak_mengajar";

export interface SesiJadwalMonitoring {
  jadwalId: string;
  guruId: string;
  guruNama: string;
  guruNip?: string | null;
  mataPelajaran: string;
  jamMulai: string; // format HH:mm
  jamSelesai: string; // format HH:mm
  statusPresensi: StatusPresensiMengajar;
  statusPresensiLabel: "Sudah Presensi" | "Belum Presensi" | "Tidak Mengajar";
  fotoAbsensi?: string | null;
  waktuSubmit?: string | null; // format HH:mm
  waktuSubmitRaw?: string | null;
}

export interface MonitoringKelasItem {
  kelasId: string;
  namaKelas: string;
  tingkat: "7" | "8" | "9" | "Lainnya";
  statusRuang: StatusRuangKelas;
  statusRuangLabel: "Sedang Digunakan" | "Kosong";
  sesiAktif: SesiJadwalMonitoring | null;
  seluruhSesiHariIni: SesiJadwalMonitoring[];
  sesiBerikutnya?: SesiJadwalMonitoring | null;
}

export interface MonitoringKelasSummary {
  totalKelas: number;
  sedangDigunakan: number;
  kosong: number;
  isOperasional: boolean;
  keteranganOperasional?: string | null;
  jamSekarangWIB: string;
  tanggalWIB: string;
  hariWIB: string;
}

export interface MonitoringKelasResponse {
  summary: MonitoringKelasSummary;
  kelasList: MonitoringKelasItem[];
}

/**
 * Mengambil data status monitoring seluruh kelas secara aktual (WIB)
 * Khusus untuk role Kepala Sekolah
 */
export async function getMonitoringKelasRealtime(): Promise<MonitoringKelasResponse> {
  // 1. Guard keamanan otorisasi: Khusus role Kepala Sekolah
  await requireAuth(["kepala_sekolah"]);

  const today = getTodayWIB();
  const nowJam = getJamWIB();
  let hari = getHariWIB();

  // Dukungan Mode Testing (Simulasi hari jika diaktifkan)
  const testConfig = await getDevTestingConfigServer();
  if (testConfig.isActive && testConfig.simDay) {
    hari = testConfig.simDay.toLowerCase();
  }

  // 2. Evaluasi status operasional harian (libur panjang, libur nasional, weekend)
  const statusOp = await getStatusOperasionalHariIni(today);
  const isOperasional = testConfig.isActive ? true : statusOp.isOperasional;

  // 3. Query paralel ke tabel kelas, jadwal hari ini, dan absensi mengajar hari ini
  const [kelasRes, jadwalRes, absensiRes] = await Promise.all([
    supabaseAdmin
      .from("kelas")
      .select("id, nama_kelas")
      .order("nama_kelas", { ascending: true }),
    supabaseAdmin
      .from("jadwal")
      .select("id, guru_id, kelas_id, mata_pelajaran, hari, jam_mulai, jam_selesai, status, guru:guru_id(id, nama, nip)")
      .eq("hari", hari)
      .eq("status", "aktif")
      .order("jam_mulai", { ascending: true }),
    supabaseAdmin
      .from("absensi_mengajar")
      .select("id, jadwal_id, status, foto_absensi, waktu_submit")
      .eq("tanggal", today),
  ]);

  if (kelasRes.error) {
    console.error("Gagal mengambil data kelas:", kelasRes.error);
    throw new Error(kelasRes.error.message);
  }

  const allKelas = kelasRes.data || [];
  const allJadwal = jadwalRes.data || [];
  const allAbsensi = absensiRes.data || [];

  // Peta absensi mengajar berdasarkan jadwal_id
  const absensiMap = new Map<string, (typeof allAbsensi)[0]>();
  allAbsensi.forEach((a) => {
    absensiMap.set(a.jadwal_id, a);
  });

  // Peta jadwal berdasarkan kelas_id
  const jadwalByKelasMap = new Map<string, typeof allJadwal>();
  allJadwal.forEach((j) => {
    const list = jadwalByKelasMap.get(j.kelas_id) || [];
    list.push(j);
    jadwalByKelasMap.set(j.kelas_id, list);
  });

  let totalSedangDigunakan = 0;

  // 4. Komputasi status setiap kelas
  const kelasList: MonitoringKelasItem[] = allKelas.map((k) => {
    const rawJadwals = jadwalByKelasMap.get(k.id) || [];

    // Map jadwal menjadi format SesiJadwalMonitoring
    const sesiList: SesiJadwalMonitoring[] = rawJadwals.map((j) => {
      const absRecord = absensiMap.get(j.id);
      const guruObj = Array.isArray(j.guru) ? j.guru[0] : j.guru;

      let statusPresensi: StatusPresensiMengajar = "belum_presensi";
      let statusPresensiLabel: "Sudah Presensi" | "Belum Presensi" | "Tidak Mengajar" = "Belum Presensi";

      if (absRecord) {
        if (absRecord.status === "tidak_mengajar") {
          statusPresensi = "tidak_mengajar";
          statusPresensiLabel = "Tidak Mengajar";
        } else {
          statusPresensi = "sudah_presensi";
          statusPresensiLabel = "Sudah Presensi";
        }
      }

      const jamMulaiFormatted = (j.jam_mulai || "").slice(0, 5);
      const jamSelesaiFormatted = (j.jam_selesai || "").slice(0, 5);

      return {
        jadwalId: j.id,
        guruId: j.guru_id,
        guruNama: guruObj?.nama || "Guru Belum Terdata",
        guruNip: guruObj?.nip || null,
        mataPelajaran: j.mata_pelajaran || "-",
        jamMulai: jamMulaiFormatted,
        jamSelesai: jamSelesaiFormatted,
        statusPresensi,
        statusPresensiLabel,
        fotoAbsensi: absRecord?.foto_absensi || null,
        waktuSubmit: absRecord?.waktu_submit ? formatJamWIB(absRecord.waktu_submit) : null,
        waktuSubmitRaw: absRecord?.waktu_submit || null,
      };
    });

    // Cari sesi yang aktif saat ini (jam_mulai <= now < jam_selesai)
    let sesiAktif: SesiJadwalMonitoring | null = null;

    if (isOperasional) {
      const activeCandidates = sesiList.filter((sesi) =>
        isWaktuDalamJadwal(nowJam, sesi.jamMulai, sesi.jamSelesai)
      );

      if (activeCandidates.length > 0) {
        // Prioritaskan sesi yang sudah presensi jika terjadi overlap di database
        const prioritized = activeCandidates.find((s) => s.statusPresensi === "sudah_presensi");
        sesiAktif = prioritized || activeCandidates[0];
      }
    }

    const statusRuang: StatusRuangKelas = sesiAktif ? "sedang_digunakan" : "kosong";
    const statusRuangLabel: "Sedang Digunakan" | "Kosong" =
      statusRuang === "sedang_digunakan" ? "Sedang Digunakan" : "Kosong";

    if (statusRuang === "sedang_digunakan") {
      totalSedangDigunakan++;
    }

    // Cari sesi berikutnya yang belum mulai hari ini
    const sesiBerikutnya = sesiList.find(
      (sesi) => sesi.jamMulai > nowJam.slice(0, 5)
    ) || null;

    return {
      kelasId: k.id,
      namaKelas: k.nama_kelas,
      tingkat: ekstrakTingkatKelas(k.nama_kelas),
      statusRuang,
      statusRuangLabel,
      sesiAktif,
      seluruhSesiHariIni: sesiList,
      sesiBerikutnya,
    };
  });

  const totalKelas = allKelas.length;
  const totalKosong = totalKelas - totalSedangDigunakan;

  return {
    summary: {
      totalKelas,
      sedangDigunakan: totalSedangDigunakan,
      kosong: totalKosong,
      isOperasional,
      keteranganOperasional: !isOperasional
        ? statusOp.deskripsi || "Hari ini adalah hari libur sekolah."
        : null,
      jamSekarangWIB: nowJam.slice(0, 5),
      tanggalWIB: today,
      hariWIB: hari.charAt(0).toUpperCase() + hari.slice(1),
    },
    kelasList,
  };
}

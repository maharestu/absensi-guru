"use server";

/**
 * SERVER ACTIONS - PRESENSI
 */

import { supabaseAdmin } from "@/lib/supabase";
import { isWithinGeofence } from "@/lib/geo";
import { getLokasiSekolah } from "@/actions/pengaturan";
import { uploadFotoAbsensi, KategoriAbsensi } from "@/lib/storage";
import { STATUS_MASUK } from "@/lib/status";
import { getHariWIB, getTodayWIB, getJamWIB } from "@/lib/date";

export async function cekStatusAbsensiHariIni(guruId: string, tanggal: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("absensi_masuk")
      .select("status, waktu_submit")
      .eq("guru_id", guruId)
      .eq("tanggal", tanggal)
      .maybeSingle();

    if (error) {
      console.error("Error cekStatusAbsensiHariIni:", error);
      return { completed: false };
    }

    if (data) {
      return { completed: true, status: data.status, waktu: data.waktu_submit };
    }
    
    return { completed: false };
  } catch (error) {
    console.error("Error cekStatusAbsensiHariIni:", error);
    return { completed: false };
  }
}

export async function getAbsensiMengajarHariIni(guruId: string, tanggal: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("absensi_mengajar")
      .select("jadwal_id")
      .eq("tanggal", tanggal)
      // Kita perlu join ke jadwal untuk mengecek guru_id, tapi karena biasanya kita query jadwalnya dulu
      // dan hanya ambil ID nya, kita bisa kembalikan semuanya untuk hari ini, lalu filter di client.
      // Lebih baik kita query semua absen hari ini lalu biarkan client memfilternya sesuai jadwal yang tampil.
      
    if (error) {
      console.error("Error getAbsensiMengajarHariIni:", error);
      return [];
    }

    return data?.map(d => d.jadwal_id) || [];
  } catch (error) {
    console.error("Error getAbsensiMengajarHariIni:", error);
    return [];
  }
}

export async function submitPresensiMasukAction(formData: FormData) {
  try {
    const guruId = formData.get("guruId") as string;
    const tanggal = formData.get("tanggal") as string;
    const status = formData.get("status") as string;
    const file = formData.get("file") as File;
    const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
    const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

    if (!guruId || !tanggal || !status || !file) {
      throw new Error("Data presensi tidak lengkap.");
    }

    if (!STATUS_MASUK.includes(status as any)) {
      throw new Error("Status presensi tidak valid.");
    }

    // CEK DUPLIKASI SEBELUM UPLOAD FOTO (Mencegah pemborosan storage)
    const { data: existingData } = await supabaseAdmin
      .from("absensi_masuk")
      .select("id")
      .eq("guru_id", guruId)
      .eq("tanggal", tanggal)
      .maybeSingle();
      
    if (existingData) {
      throw new Error("Anda sudah melakukan absensi untuk tanggal ini.");
    }

    if (status === "hadir") {
      if (!latitude || !longitude) {
        throw new Error("Lokasi (GPS) wajib diisi untuk absensi hadir.");
      }
      
      const config = await getLokasiSekolah();
      const isValidLocation = isWithinGeofence(
        latitude, 
        longitude, 
        config.latitude, 
        config.longitude, 
        config.radius_meter
      );

      if (!isValidLocation) {
        throw new Error("Absensi ditolak: Anda terdeteksi berada di luar area sekolah.");
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload foto ke Supabase Storage
    const publicUrl = await uploadFotoAbsensi({
      buffer,
      guruId,
      kategori: status as KategoriAbsensi,
      tanggal,
    });

    // Insert ke database
    const insertData: any = {
      guru_id: guruId,
      tanggal,
      status,
    };

    if (status === "hadir") {
      insertData.foto_absensi = publicUrl;
      if (latitude && longitude) {
        insertData.latitude = latitude;
        insertData.longitude = longitude;
      }
    } else {
      insertData.file_bukti_izin_sakit = publicUrl;
    }

    const { error } = await supabaseAdmin
      .from("absensi_masuk")
      .insert(insertData);

    if (error) {
      if (error.code === '23505') {
        throw new Error("Anda sudah melakukan absensi untuk tanggal ini.");
      }
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Presensi Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function submitPresensiMengajarAction(formData: FormData) {
  try {
    const guruId = formData.get("guruId") as string;
    const jadwalId = formData.get("jadwalId") as string;
    const file = formData.get("file") as File;
    const tanggal = getTodayWIB(); // Abaikan tanggal dari client

    if (!guruId || !jadwalId || !file) {
      throw new Error("Data presensi mengajar tidak lengkap.");
    }

    // Validasi ulang: Pastikan sudah absen hadir hari ini
    const statusHariIni = await cekStatusAbsensiHariIni(guruId, tanggal);
    if (!statusHariIni.completed || statusHariIni.status !== "hadir") {
      throw new Error("Anda belum melakukan absensi masuk (Hadir) hari ini.");
    }

    // Ambil jadwal
    const { data: jadwal } = await supabaseAdmin
      .from("jadwal")
      .select("id, guru_id, hari, jam_mulai, jam_selesai")
      .eq("id", jadwalId)
      .single();

    if (!jadwal || jadwal.guru_id !== guruId || jadwal.hari !== getHariWIB()) {
      throw new Error("Jadwal tidak valid.");
    }

    // Validasi waktu
    const jamSekarang = getJamWIB();
    if (jamSekarang < jadwal.jam_mulai || jamSekarang > jadwal.jam_selesai) {
      throw new Error(`Anda hanya dapat absen pada rentang ${jadwal.jam_mulai.substring(0,5)} - ${jadwal.jam_selesai.substring(0,5)} WIB.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload foto
    const publicUrl = await uploadFotoAbsensi({
      buffer,
      guruId,
      kategori: "mengajar",
      tanggal,
      jadwalId,
    });

    // Insert ke database
    const { error } = await supabaseAdmin
      .from("absensi_mengajar")
      .insert({
        jadwal_id: jadwalId,
        tanggal,
        foto_absensi: publicUrl,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error("Anda sudah absensi mengajar untuk kelas ini pada tanggal ini.");
      }
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Presensi Mengajar Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function verifyQrKelas(jadwalId: string, scannedQr: string, lat?: number, lng?: number): Promise<boolean> {
  try {
    const { data: jadwal } = await supabaseAdmin
      .from("jadwal")
      .select("kelas_id")
      .eq("id", jadwalId)
      .single();
      
    if (!jadwal) return false;

    const { data: kelas } = await supabaseAdmin
      .from("kelas")
      .select("id, kode_qr")
      .eq("id", jadwal.kelas_id)
      .single();

    if (!kelas) return false;

    // Validasi lokasi jika dikirim
    if (lat && lng) {
      const config = await getLokasiSekolah();
      const isValid = isWithinGeofence(lat, lng, config.latitude, config.longitude, config.radius_meter);
      if (!isValid) return false;
    }

    return kelas.kode_qr === scannedQr || kelas.id === scannedQr;
  } catch (error) {
    console.error("verifyQrKelas Error:", error);
    return false;
  }
}

export async function validasiQrMengajar(guruId: string, kodeQr: string, lat?: number, lng?: number) {
  try {
    // 0. Validasi Lokasi jika dikirim
    if (lat && lng) {
      const config = await getLokasiSekolah();
      const isValid = isWithinGeofence(lat, lng, config.latitude, config.longitude, config.radius_meter);
      if (!isValid) {
        return { ok: false, error: "DILUAR_AREA", message: "Absensi ditolak: Anda terdeteksi berada di luar area sekolah." };
      }
    }

    // 1. Cek kode QR kelas
    const { data: kelas } = await supabaseAdmin
      .from("kelas")
      .select("id, nama_kelas, kode_qr")
      .eq("kode_qr", kodeQr)
      .maybeSingle();

    if (!kelas) {
      return { ok: false, error: "QR_TIDAK_DIKENAL", message: "Kode QR tidak valid atau kelas tidak ditemukan." };
    }

    // 2. Cek absen masuk guru hari ini
    const today = getTodayWIB();
    const statusMasuk = await cekStatusAbsensiHariIni(guruId, today);
    if (!statusMasuk.completed || statusMasuk.status !== "hadir") {
      return { ok: false, error: "BELUM_HADIR", message: "Anda belum melakukan absensi masuk (Hadir) hari ini." };
    }

    // 3. Ambil jadwal guru hari ini di kelas ini
    const hariIni = getHariWIB();
    const { data: jadwalList } = await supabaseAdmin
      .from("jadwal")
      .select("id, jam_mulai, jam_selesai, mata_pelajaran")
      .eq("guru_id", guruId)
      .eq("kelas_id", kelas.id)
      .eq("hari", hariIni)
      .eq("status", "aktif");

    if (!jadwalList || jadwalList.length === 0) {
      return { ok: false, error: "TIDAK_ADA_JADWAL", message: `Anda tidak memiliki jadwal di ${kelas.nama_kelas} hari ini.` };
    }

    // 4. Buang jadwal yang sudah diabsen
    const { data: absensiList } = await supabaseAdmin
      .from("absensi_mengajar")
      .select("jadwal_id")
      .in("jadwal_id", jadwalList.map(j => j.id))
      .eq("tanggal", today);

    const sudahAbsenIds = absensiList?.map(a => a.jadwal_id) || [];
    const jadwalSisa = jadwalList.filter(j => !sudahAbsenIds.includes(j.id));

    if (jadwalSisa.length === 0) {
      return { ok: false, error: "SUDAH_ABSEN", message: `Anda sudah mengabsen semua jadwal di ${kelas.nama_kelas} hari ini.` };
    }

    // 5. Validasi waktu
    const jamSekarang = getJamWIB();
    const jadwalTepatWaktu = jadwalSisa.filter(j => jamSekarang >= j.jam_mulai && jamSekarang <= j.jam_selesai);

    if (jadwalTepatWaktu.length === 0) {
      return { ok: false, error: "DILUAR_WAKTU", message: "Belum waktunya atau sudah lewat waktu mengajar untuk kelas ini." };
    }

    return { ok: true, kelas: kelas.nama_kelas, jadwal: jadwalTepatWaktu };
  } catch (error) {
    console.error("validasiQrMengajar Error:", error);
    return { ok: false, error: "SYSTEM_ERROR", message: "Terjadi kesalahan sistem." };
  }
}

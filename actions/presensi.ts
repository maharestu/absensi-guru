"use server";

/**
 * SERVER ACTIONS - PRESENSI
 */

import { supabaseAdmin } from "@/lib/supabase";
import { uploadFotoAbsensi, KategoriAbsensi } from "@/lib/storage";

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
    const tanggal = formData.get("tanggal") as string;
    const file = formData.get("file") as File;

    if (!guruId || !jadwalId || !tanggal || !file) {
      throw new Error("Data presensi mengajar tidak lengkap.");
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

export async function verifyQrKelas(jadwalId: string, scannedQr: string): Promise<boolean> {
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

    // Cocokkan baik ke kode_qr maupun id (fallback)
    return kelas.kode_qr === scannedQr || kelas.id === scannedQr;
  } catch (error) {
    console.error("verifyQrKelas Error:", error);
    return false;
  }
}

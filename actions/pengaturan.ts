"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { isWithinGeofence } from "@/lib/geo";

export async function getLokasiSekolah() {
  const { data, error } = await supabaseAdmin
    .from("pengaturan_lokasi_sekolah")
    .select("latitude, longitude, radius_meter")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Pengaturan lokasi sekolah tidak ditemukan di database.");
  }

  return data;
}

export async function verifikasiLokasiSekolah(userLat: number, userLng: number) {
  try {
    const config = await getLokasiSekolah();
    const isValid = isWithinGeofence(
      userLat,
      userLng,
      config.latitude,
      config.longitude,
      config.radius_meter
    );

    return {
      success: true,
      isValid,
      radiusMeter: config.radius_meter,
    };
  } catch (err: any) {
    console.error("verifikasiLokasiSekolah error:", err);
    return {
      success: false,
      isValid: false,
      error: err.message || "Gagal memverifikasi lokasi dari database.",
    };
  }
}

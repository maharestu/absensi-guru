"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function getLokasiSekolah() {
  const { data, error } = await supabaseAdmin
    .from("pengaturan_lokasi_sekolah")
    .select("latitude, longitude, radius_meter")
    .single();

  if (error || !data) {
    // Fallback if no settings exist
    return {
      latitude: -6.291515492020475,
      longitude: 107.29753131609773,
      radius_meter: 5000,
    };
  }

  return data
}

/**
 * Server-side helper untuk upload file ke Supabase Storage.
 * JANGAN digunakan di client-side!
 */

import { supabaseAdmin } from "@/lib/supabase";

export type KategoriAbsensi = "hadir" | "sakit" | "izin" | "dinas" | "mengajar";

export interface UploadFotoParams {
  buffer: Buffer;
  guruId: string;
  kategori: KategoriAbsensi;
  tanggal: string; // YYYY-MM-DD
  jadwalId?: string; // Khusus mengajar
}

/**
 * Upload foto (berformat WebP) ke bucket 'foto-absensi'.
 * Memisahkan folder 'harian' dan 'mengajar' sesuai tipe absensi.
 *
 * @returns public URL dari file yang diunggah
 */
export async function uploadFotoAbsensi({
  buffer,
  guruId,
  kategori,
  tanggal,
  jadwalId,
}: UploadFotoParams): Promise<string> {
  const timestamp = Date.now();
  
  let path = "";
  if (kategori === "mengajar") {
    path = `mengajar/${guruId}/${jadwalId}_${tanggal}_${timestamp}.webp`;
  } else {
    path = `harian/${kategori}/${guruId}/${tanggal}_${timestamp}.webp`;
  }

  const { error } = await supabaseAdmin.storage
    .from("foto-absensi")
    .upload(path, buffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) {
    console.error("Gagal upload foto absensi:", error.message);
    throw new Error(`Gagal upload foto: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("foto-absensi").getPublicUrl(path);

  return publicUrl;
}

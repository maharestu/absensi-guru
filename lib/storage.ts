/**
 * Server-side helper untuk upload file ke Supabase Storage.
 * JANGAN digunakan di client-side!
 */

import { supabaseAdmin } from "@/lib/supabase";

export type KategoriAbsensi = "hadir" | "sakit" | "izin" | "dinas" | "mengajar" | "pulang";

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

/**
 * Hapus foto dari bucket 'foto-absensi'.
 * Mendukung input berupa relative path ataupun public URL Supabase Storage.
 */
export async function deleteFotoAbsensi(pathOrUrl: string): Promise<boolean> {
  try {
    if (!pathOrUrl) return false;

    let path = pathOrUrl;
    if (pathOrUrl.includes("/foto-absensi/")) {
      const parts = pathOrUrl.split("/foto-absensi/");
      path = parts[parts.length - 1];
    }

    const { error } = await supabaseAdmin.storage
      .from("foto-absensi")
      .remove([path]);

    if (error) {
      console.error("Gagal menghapus foto dari storage:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("deleteFotoAbsensi Error:", err.message);
    return false;
  }
}


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

/**
 * Ekstrak storage path dari sebuah URL publik Supabase Storage.
 * Mengembalikan null jika URL tidak valid atau bukan URL foto-absensi.
 */
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/foto-absensi/")) {
    const parts = url.split("/foto-absensi/");
    const path = parts[parts.length - 1];
    return path || null;
  }
  return null;
}

/**
 * Hapus seluruh foto absensi milik satu guru dari Supabase Storage.
 *
 * Mencakup foto dari:
 * - absensi_masuk: foto_absensi, file_bukti_izin_sakit, foto_pulang
 * - absensi_mengajar (via jadwal guru): foto_absensi
 *
 * Proses penghapusan file dilakukan SEBELUM baris database dihapus agar tidak ada
 * file fisik yang tertinggal tanpa penanganan apabila penghapusan DB gagal.
 *
 * @returns objek ringkasan: jumlah file berhasil dihapus dan gagal dihapus
 */
export async function deleteFotoGuruFromStorage(guruId: string): Promise<{
  deleted: number;
  failed: number;
  errors: string[];
}> {
  const result = { deleted: 0, failed: 0, errors: [] as string[] };

  try {
    // 1. Kumpulkan seluruh URL foto dari absensi_masuk
    const { data: absensiMasukRows, error: errMasuk } = await supabaseAdmin
      .from("absensi_masuk")
      .select("foto_absensi, file_bukti_izin_sakit, foto_pulang")
      .eq("guru_id", guruId);

    if (errMasuk) {
      result.errors.push(`Gagal mengambil data absensi_masuk: ${errMasuk.message}`);
    } else {
      for (const row of absensiMasukRows ?? []) {
        const urls = [row.foto_absensi, row.file_bukti_izin_sakit, row.foto_pulang];
        for (const url of urls) {
          const path = extractStoragePath(url);
          if (!path) continue;
          const ok = await deleteFotoAbsensi(path);
          if (ok) {
            result.deleted++;
          } else {
            result.failed++;
            result.errors.push(`Gagal hapus: ${path}`);
          }
        }
      }
    }

    // 2. Kumpulkan seluruh jadwal_id milik guru ini, lalu ambil foto absensi_mengajar
    const { data: jadwalRows, error: errJadwal } = await supabaseAdmin
      .from("jadwal")
      .select("id")
      .eq("guru_id", guruId);

    if (errJadwal) {
      result.errors.push(`Gagal mengambil data jadwal: ${errJadwal.message}`);
    } else {
      const jadwalIds = (jadwalRows ?? []).map((j) => j.id);
      if (jadwalIds.length > 0) {
        const { data: absensiMengajarRows, error: errMengajar } = await supabaseAdmin
          .from("absensi_mengajar")
          .select("foto_absensi")
          .in("jadwal_id", jadwalIds);

        if (errMengajar) {
          result.errors.push(`Gagal mengambil data absensi_mengajar: ${errMengajar.message}`);
        } else {
          for (const row of absensiMengajarRows ?? []) {
            const path = extractStoragePath(row.foto_absensi);
            if (!path) continue;
            const ok = await deleteFotoAbsensi(path);
            if (ok) {
              result.deleted++;
            } else {
              result.failed++;
              result.errors.push(`Gagal hapus: ${path}`);
            }
          }
        }
      }
    }
  } catch (err: any) {
    result.errors.push(`deleteFotoGuruFromStorage Error: ${err.message}`);
  }

  if (result.errors.length > 0) {
    console.error(`deleteFotoGuruFromStorage [guruId=${guruId}]: ${result.errors.join("; ")}`);
  }

  return result;
}

/**
 * Hapus seluruh foto absensi milik banyak guru sekaligus dari Supabase Storage.
 * Menerima array guru ID dan memproses penghapusan secara paralel per guru.
 *
 * @returns ringkasan total file yang berhasil dan gagal dihapus
 */
export async function deleteFotoBanyakGuruFromStorage(guruIds: string[]): Promise<{
  deleted: number;
  failed: number;
  errors: string[];
}> {
  const aggregate = { deleted: 0, failed: 0, errors: [] as string[] };
  if (guruIds.length === 0) return aggregate;

  const results = await Promise.all(guruIds.map((id) => deleteFotoGuruFromStorage(id)));
  for (const r of results) {
    aggregate.deleted += r.deleted;
    aggregate.failed += r.failed;
    aggregate.errors.push(...r.errors);
  }
  return aggregate;
}


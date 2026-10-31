"use server";

/**
 * SERVER ACTIONS — JADWAL
 * Fetch and manage jadwal mengajar dari Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Jadwal, JadwalWithDetail } from "@/types/schema";
import { requireAdmin } from "@/lib/session";

export async function getJadwalList(): Promise<JadwalWithDetail[]> {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `)
    .order("hari")
    .order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal list:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function getJadwalById(id: string): Promise<JadwalWithDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching jadwal by id:", error);
    return null;
  }

  return (data as unknown as JadwalWithDetail) ?? null;
}

export async function getJadwalByGuruAndHari(
  guruId?: string,
  kelasId?: string,
  hari?: string
): Promise<JadwalWithDetail[]> {
  const VALID_HARI = ["senin", "selasa", "rabu", "kamis", "jumat"];
  const { getDevTestingConfigServer } = await import("@/lib/testing-mode");
  const testConfig = await getDevTestingConfigServer();

  let targetHari = hari ? hari.toLowerCase() : undefined;

  // Jika mode testing aktif dan hari ini akhir pekan, simulasikan hari yang dipilih di mode testing
  if (testConfig.isActive && targetHari && !VALID_HARI.includes(targetHari)) {
    targetHari = (testConfig.simDay || "senin").toLowerCase();
  }

  if (targetHari && !VALID_HARI.includes(targetHari)) {
    return [];
  }

  let query = supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `);

  if (guruId) query = query.eq("guru_id", guruId);
  if (kelasId) query = query.eq("kelas_id", kelasId);
  if (targetHari) query = query.eq("hari", targetHari);

  const { data, error } = await query.order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function createJadwal(input: Omit<Jadwal, "id" | "created_at">) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateJadwal(id: string, input: Partial<Jadwal>) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function checkJadwalRelations(
  id?: string
): Promise<{ hasRelations: boolean; details: string[]; warningMessage?: string }> {
  try {
    let absensiQuery = supabaseAdmin.from("absensi_mengajar").select("id", { count: "exact", head: true });

    if (id) {
      absensiQuery = absensiQuery.eq("jadwal_id", id);
    } else {
      absensiQuery = absensiQuery.not("jadwal_id", "is", null);
    }

    const { count } = await absensiQuery;
    const details: string[] = [];

    if ((count ?? 0) > 0) {
      details.push(`${count} catatan riwayat presensi mengajar guru`);
    }

    return {
      hasRelations: details.length > 0,
      details,
      warningMessage:
        details.length > 0
          ? `Jadwal masih terhubung dengan ${details.join(", ")}.`
          : undefined,
    };
  } catch (err: any) {
    console.error("checkJadwalRelations Error:", err);
    return { hasRelations: false, details: [] };
  }
}

export async function deleteJadwal(
  id: string
): Promise<{ success: boolean; error?: string; isRelationError?: boolean }> {
  try {
    await requireAdmin();
    const rel = await checkJadwalRelations(id);
    if (rel.hasRelations) {
      return {
        success: false,
        isRelationError: true,
        error: `Jadwal ini tidak dapat dihapus karena sudah memiliki ${rel.details.join(" serta ")}. Harap hapus catatan absensi mengajar terkait terlebih dahulu.`,
      };
    }

    const { error } = await supabaseAdmin.from("jadwal").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          isRelationError: true,
          error: "Jadwal ini masih memiliki riwayat presensi mengajar.",
        };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAllJadwal(
  forceCascade = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!forceCascade) {
      const rel = await checkJadwalRelations();
      if (rel.hasRelations) {
        return {
          success: false,
          error: "Terdapat jadwal yang sudah memiliki riwayat absensi mengajar.",
        };
      }
      const { error } = await supabaseAdmin.from("jadwal").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return { success: true };
    }

    // Force Cascade:
    // 1. Hapus riwayat absensi mengajar
    await supabaseAdmin.from("absensi_mengajar").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Hapus seluruh jadwal
    const { error } = await supabaseAdmin.from("jadwal").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("deleteAllJadwal Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Menggabungkan jadwal-jadwal mengajar yang terpotong oleh jam istirahat sekolah.
 * Jika guru, kelas, mata pelajaran, dan hari sama, dan jeda antara jam_selesai sesi 1
 * dan jam_mulai sesi 2 adalah jeda istirahat (<= 60 menit), maka:
 * 1. jam_selesai sesi 1 diperpanjang hingga jam_selesai sesi 2.
 * 2. Catatan absensi_mengajar pada sesi 2 dialihkan ke sesi 1.
 * 3. Sesi 2 yang redundan dihapus dari tabel jadwal.
 */
export async function konsolidasiJadwalTerpotongIstirahat(): Promise<{ success: boolean; mergedCount: number; error?: string }> {
  try {
    const { data: allJadwals, error } = await supabaseAdmin
      .from("jadwal")
      .select("id, guru_id, kelas_id, mata_pelajaran, hari, jam_mulai, jam_selesai, status")
      .eq("status", "aktif")
      .order("hari")
      .order("kelas_id")
      .order("jam_mulai");

    if (error) throw error;
    if (!allJadwals || allJadwals.length === 0) {
      return { success: true, mergedCount: 0 };
    }

    // Kelompokkan jadwal berdasarkan guru_id, kelas_id, mata_pelajaran (normalized), dan hari
    const normMapel = (m: string) => (m || "").trim().toUpperCase();
    const grouped = new Map<string, typeof allJadwals>();

    for (const j of allJadwals) {
      const key = `${j.guru_id}_${j.kelas_id}_${normMapel(j.mata_pelajaran)}_${j.hari.toLowerCase()}`;
      const list = grouped.get(key) || [];
      list.push(j);
      grouped.set(key, list);
    }

    let mergedCount = 0;

    for (const [_, list] of grouped.entries()) {
      if (list.length < 2) continue;

      // Urutkan berdasarkan jam_mulai
      list.sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));

      let i = 0;
      while (i < list.length - 1) {
        const sesi1 = list[i];
        const sesi2 = list[i + 1];

        const [s1H, s1M] = sesi1.jam_selesai.split(":").map(Number);
        const [s2H, s2M] = sesi2.jam_mulai.split(":").map(Number);
        const gapMinutes = (s2H * 60 + s2M) - (s1H * 60 + s1M);

        // Jika jeda waktu antara sesi 1 dan sesi 2 adalah jeda istirahat (0 s.d. 60 menit)
        if (gapMinutes >= 0 && gapMinutes <= 60) {
          // 1. Update sesi 1 dengan jam_selesai dari sesi 2
          const newJamSelesai = sesi2.jam_selesai > sesi1.jam_selesai ? sesi2.jam_selesai : sesi1.jam_selesai;
          await supabaseAdmin
            .from("jadwal")
            .update({ jam_selesai: newJamSelesai })
            .eq("id", sesi1.id);

          sesi1.jam_selesai = newJamSelesai;

          // 2. Alihkan data absensi_mengajar sesi 2 ke sesi 1 jika ada
          const { data: absensiSesi2 } = await supabaseAdmin
            .from("absensi_mengajar")
            .select("id, tanggal")
            .eq("jadwal_id", sesi2.id);

          if (absensiSesi2 && absensiSesi2.length > 0) {
            for (const abs of absensiSesi2) {
              // Cek apakah sesi 1 sudah memiliki absensi di tanggal yang sama
              const { data: existingAbsensiSesi1 } = await supabaseAdmin
                .from("absensi_mengajar")
                .select("id")
                .eq("jadwal_id", sesi1.id)
                .eq("tanggal", abs.tanggal)
                .maybeSingle();

              if (existingAbsensiSesi1) {
                // Sesi 1 sudah diabsen pada tanggal tersebut, hapus duplikat dari sesi 2
                await supabaseAdmin.from("absensi_mengajar").delete().eq("id", abs.id);
              } else {
                // Alihkan jadwal_id ke sesi 1
                await supabaseAdmin
                  .from("absensi_mengajar")
                  .update({ jadwal_id: sesi1.id })
                  .eq("id", abs.id);
              }
            }
          }

          // 3. Hapus sesi 2 yang redundan dari database
          await supabaseAdmin.from("jadwal").delete().eq("id", sesi2.id);

          // Hapus sesi 2 dari daftar in-memory list
          list.splice(i + 1, 1);
          mergedCount++;
        } else {
          i++;
        }
      }
    }

    return { success: true, mergedCount };
  } catch (err: any) {
    console.error("konsolidasiJadwalTerpotongIstirahat Error:", err);
    return { success: false, mergedCount: 0, error: err.message };
  }
}


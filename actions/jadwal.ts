"use server";

/**
 * SERVER ACTIONS — JADWAL
 * Fetch and manage jadwal mengajar dari Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Jadwal, JadwalWithDetail } from "@/types/schema";

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

  if (hari) {
    const normalizedHari = hari.toLowerCase();
    if (!VALID_HARI.includes(normalizedHari)) {
      return [];
    }
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
  if (hari) query = query.eq("hari", hari.toLowerCase());

  const { data, error } = await query.order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function createJadwal(input: Omit<Jadwal, "id" | "created_at">) {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateJadwal(id: string, input: Partial<Jadwal>) {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteJadwal(id: string) {
  const { error } = await supabaseAdmin
    .from("jadwal")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

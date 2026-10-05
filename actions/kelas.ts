"use server";

/**
 * SERVER ACTIONS — KELAS
 * Fetch data kelas dari tabel `kelas` di Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Kelas } from "@/types/schema";

export async function getKelasList(): Promise<Kelas[]> {
  const { data, error } = await supabaseAdmin
    .from("kelas")
    .select("*")
    .order("nama_kelas");
  if (error) throw new Error(error.message);
  return (data ?? []) as Kelas[];
}

/** Filter kelas berdasarkan tingkat (e.g. "7" → Kelas 7A, 7B, 7C) */
export async function getKelasByTingkat(tingkat: string): Promise<Kelas[]> {
  const { data, error } = await supabaseAdmin
    .from("kelas")
    .select("*")
    .ilike("nama_kelas", `Kelas ${tingkat}%`)
    .order("nama_kelas");
  if (error) throw new Error(error.message);
  return (data ?? []) as Kelas[];
}

export async function getKelasById(id: string): Promise<Kelas | null> {
  const { data, error } = await supabaseAdmin
    .from("kelas")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Kelas;
}

export async function createKelas(payload: { nama_kelas: string }): Promise<{ success: boolean; data?: Kelas; error?: string }> {
  try {
    const kode_qr = crypto.randomUUID();
    
    const { data, error } = await supabaseAdmin
      .from("kelas")
      .insert([{ ...payload, kode_qr }])
      .select("*")
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateKelas(id: string, payload: { nama_kelas: string }): Promise<{ success: boolean; data?: Kelas; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("kelas")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteKelas(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from("kelas")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

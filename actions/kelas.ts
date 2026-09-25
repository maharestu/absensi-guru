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

"use server";

/**
 * SERVER ACTIONS — GURU
 * CRUD untuk tabel `guru` di Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Guru } from "@/types/schema";

export async function getGuruList(): Promise<Guru[]> {
  const { data, error } = await supabaseAdmin
    .from("guru")
    .select("*")
    .order("nama");
  if (error) throw new Error(error.message);
  return (data ?? []) as Guru[];
}

export async function getGuruById(id: string): Promise<Guru | null> {
  const { data, error } = await supabaseAdmin
    .from("guru")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Guru;
}

export async function createGuru(
  input: Omit<Guru, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from("guru").insert(input);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateGuru(
  id: string,
  input: Partial<Omit<Guru, "id" | "created_at">>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("guru")
    .update(input)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteGuru(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("guru")
    .delete()
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * SEEDER — Data awal tabel `pengaturan_lokasi_sekolah`
 *
 * Cara menjalankan (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
 *   npx tsx supabase/seed-lokasi.ts
 *
 */

import { createClient } from "@supabase/supabase-js";

// ── Konfigurasi ──────────────────────────────────────────────
const SUPABASE_URL = "https://iygwlawcgcegzacnjkor.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_ROLE_KEY) {
  console.error("\n❌  SUPABASE_SERVICE_ROLE_KEY tidak ditemukan!");
  console.error(
    "    Jalankan: $env:SUPABASE_SERVICE_ROLE_KEY=\"<key>\" lalu coba lagi.\n"
  );
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Data Seed ─────────────────────────────────────────────────
const pengaturanLokasi = {
  latitude: -6.291515492020475,
  longitude: 107.29753131609773,
  radius_meter: 50000,
};

// ── Seeder ────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱  Memulai seeder pengaturan lokasi sekolah...\n");

  // Hapus data lama jika ada, agar tabel hanya berisi 1 baris pengaturan aktif
  console.log("🧹  Menghapus data lokasi lama...");
  await db.from("pengaturan_lokasi_sekolah").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // trick to delete all rows

  console.log("📌  Memasukkan data pengaturan lokasi baru...");
  const { error } = await db
    .from("pengaturan_lokasi_sekolah")
    .insert(pengaturanLokasi);

  if (error) {
    console.error("❌  Gagal insert pengaturan lokasi:", error.message);
    process.exit(1);
  }

  console.log("✅  Pengaturan lokasi sekolah berhasil disimpan.\n");
  console.log("🎉  Seeder selesai!\n");
}

seed().catch(console.error);

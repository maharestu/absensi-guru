/**
 * SEEDER — Data awal tabel `guru` dan `akun`
 *
 * Semua user (guru, kepala_sekolah, admin) memiliki NIP
 * dan terdaftar di tabel `guru` sebagai pegawai sekolah.
 *
 * Cara menjalankan (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
 *   npx tsx supabase/seed.ts
 *
 * ⚠️  Jika data sebelumnya sudah ada, hapus dulu via Supabase Dashboard
 *     (Table Editor → akun → delete all, lalu guru → delete all)
 *     sebelum menjalankan script ini kembali.
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

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

const SALT_ROUNDS = 10;

// ── Data Seed ─────────────────────────────────────────────────
// Semua pegawai sekolah punya NIP dan masuk ke tabel guru
const pegawaiData = [
  // Guru biasa
  { nip: "198001012005011001", nama: "Budi Santoso" },
  { nip: "198506152010012002", nama: "Siti Rahayu" },
  { nip: "199203202015031003", nama: "Ahmad Fauzi" },
  // Kepala Sekolah
  { nip: "197005011995031001", nama: "Drs. H. Ahmad Dahlan, M.Pd." },
  // Admin Sekolah
  { nip: "198803252008012005", nama: "Admin Sekolah" },
];

// ── Seeder ────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱  Memulai seeder...\n");

  // 1. Insert semua pegawai ke tabel guru (termasuk kepsek & admin)
  console.log("📌  Memasukkan data pegawai ke tabel guru...");
  const { data: insertedPegawai, error: pegawaiError } = await db
    .from("guru")
    .insert(pegawaiData)
    .select("id, nama, nip");

  if (pegawaiError) {
    console.error("❌  Gagal insert pegawai:", pegawaiError.message);
    process.exit(1);
  }
  console.log(`✅  ${insertedPegawai!.length} pegawai berhasil dimasukkan.\n`);

  // Mapping indeks: [0-2] guru, [3] kepsek, [4] admin
  const [guru1, guru2, guru3, kepsek, adminPegawai] = insertedPegawai!;

  // 2. Insert 5 akun dengan password di-hash
  console.log("📌  Memasukkan data akun...");

  const akunList = [
    {
      username: "guru1",
      password: "guru1",
      role: "guru",
      nama: guru1.nama,
      guru_id: guru1.id,
    },
    {
      username: "guru2",
      password: "guru2",
      role: "guru",
      nama: guru2.nama,
      guru_id: guru2.id,
    },
    {
      username: "guru3",
      password: "guru3",
      role: "guru",
      nama: guru3.nama,
      guru_id: guru3.id,
    },
    {
      username: "kepsek1",
      password: "kepsek1",
      role: "kepala_sekolah",
      nama: kepsek.nama,
      guru_id: kepsek.id,  // kepsek juga punya NIP → ada di tabel guru
    },
    {
      username: "admin1",
      password: "admin1",
      role: "admin",
      nama: adminPegawai.nama,
      guru_id: adminPegawai.id,  // admin juga punya NIP → ada di tabel guru
    },
  ];

  for (const akun of akunList) {
    const password_hash = await bcrypt.hash(akun.password, SALT_ROUNDS);

    const { error } = await db.from("akun").insert({
      username: akun.username,
      password_hash,
      role: akun.role,
      nama: akun.nama,
      guru_id: akun.guru_id,
      status: "aktif",
    });

    if (error) {
      console.error(`❌  Gagal insert akun '${akun.username}':`, error.message);
    } else {
      const pegawai = insertedPegawai!.find((p) => p.id === akun.guru_id);
      console.log(
        `✅  Akun '${akun.username}' (role: ${akun.role}, NIP: ${pegawai?.nip}) berhasil dibuat.`
      );
    }
  }

  console.log("\n🎉  Seeder selesai!\n");
}

seed().catch(console.error);

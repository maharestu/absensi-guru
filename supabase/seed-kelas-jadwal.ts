/**
 * SEEDER TAMBAHAN — Data awal tabel `kelas` dan `jadwal`
 *
 * Mengisi tabel kelas (Kelas 7A-7D, 8A-8D, 9A-9D) dan jadwal mengajar
 * yang tertaut dengan guru yang sudah ada di database.
 *
 * Cara menjalankan (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
 *   npx tsx supabase/seed-kelas-jadwal.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iygwlawcgcegzacnjkor.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_ROLE_KEY) {
  console.error("\n❌  SUPABASE_SERVICE_ROLE_KEY tidak ditemukan!");
  console.error("    Jalankan: $env:SUPABASE_SERVICE_ROLE_KEY=\"<key>\" lalu coba lagi.\n");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const kelasData = [
  { nama_kelas: "Kelas 7A", kode_qr: "QR-KELAS-7A" },
  { nama_kelas: "Kelas 7B", kode_qr: "QR-KELAS-7B" },
  { nama_kelas: "Kelas 7C", kode_qr: "QR-KELAS-7C" },
  { nama_kelas: "Kelas 8A", kode_qr: "QR-KELAS-8A" },
  { nama_kelas: "Kelas 8B", kode_qr: "QR-KELAS-8B" },
  { nama_kelas: "Kelas 8C", kode_qr: "QR-KELAS-8C" },
  { nama_kelas: "Kelas 9A", kode_qr: "QR-KELAS-9A" },
  { nama_kelas: "Kelas 9B", kode_qr: "QR-KELAS-9B" },
  { nama_kelas: "Kelas 9C", kode_qr: "QR-KELAS-9C" },
];

async function seedKelasDanJadwal() {
  console.log("\n🌱  Memulai seeder kelas dan jadwal...\n");

  // 1. Insert kelas
  console.log("📌  Memasukkan data kelas...");
  const { data: insertedKelas, error: kelasError } = await db
    .from("kelas")
    .upsert(kelasData, { onConflict: "kode_qr" })
    .select("id, nama_kelas");

  if (kelasError) {
    console.error("❌  Gagal insert kelas:", kelasError.message);
    process.exit(1);
  }
  console.log(`✅  ${insertedKelas!.length} kelas berhasil disiapkan.\n`);

  // 2. Ambil data guru yang ada
  const { data: guruList, error: guruError } = await db
    .from("guru")
    .select("id, nama, nip")
    .limit(3);

  if (guruError || !guruList || guruList.length === 0) {
    console.error("❌  Gagal mengambil data guru:", guruError?.message);
    process.exit(1);
  }

  // 3. Masukkan jadwal contoh
  console.log("📌  Memasukkan jadwal mengajar...");
  const kelas7A = insertedKelas!.find((k) => k.nama_kelas === "Kelas 7A") || insertedKelas![0];
  const kelas7B = insertedKelas!.find((k) => k.nama_kelas === "Kelas 7B") || insertedKelas![1];
  const kelas8A = insertedKelas!.find((k) => k.nama_kelas === "Kelas 8A") || insertedKelas![2];

  const jadwalData = [
    {
      guru_id: guruList[0].id,
      kelas_id: kelas7A.id,
      mata_pelajaran: "Matematika",
      hari: "senin",
      jam_mulai: "07:00:00",
      jam_selesai: "08:30:00",
      status: "aktif",
    },
    {
      guru_id: guruList[0].id,
      kelas_id: kelas7B.id,
      mata_pelajaran: "Matematika",
      hari: "senin",
      jam_mulai: "09:00:00",
      jam_selesai: "10:30:00",
      status: "aktif",
    },
    {
      guru_id: (guruList[1] || guruList[0]).id,
      kelas_id: kelas7A.id,
      mata_pelajaran: "Ilmu Pengetahuan Alam",
      hari: "senin",
      jam_mulai: "08:30:00",
      jam_selesai: "10:00:00",
      status: "aktif",
    },
    {
      guru_id: (guruList[2] || guruList[0]).id,
      kelas_id: kelas8A.id,
      mata_pelajaran: "Bahasa Indonesia",
      hari: "selasa",
      jam_mulai: "07:30:00",
      jam_selesai: "09:00:00",
      status: "aktif",
    },
  ];

  const { data: insertedJadwal, error: jadwalError } = await db
    .from("jadwal")
    .insert(jadwalData)
    .select("id");

  if (jadwalError) {
    console.error("❌  Gagal insert jadwal:", jadwalError.message);
  } else {
    console.log(`✅  ${insertedJadwal.length} jadwal contoh berhasil dimasukkan.`);
  }

  console.log("\n🎉  Seeder kelas & jadwal selesai!\n");
}

seedKelasDanJadwal().catch(console.error);

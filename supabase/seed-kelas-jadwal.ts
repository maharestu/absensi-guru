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
  { nama_kelas: "Kelas 7D", kode_qr: "QR-KELAS-7D" },
  { nama_kelas: "Kelas 8A", kode_qr: "QR-KELAS-8A" },
  { nama_kelas: "Kelas 8B", kode_qr: "QR-KELAS-8B" },
  { nama_kelas: "Kelas 8C", kode_qr: "QR-KELAS-8C" },
  { nama_kelas: "Kelas 8D", kode_qr: "QR-KELAS-8D" },
  { nama_kelas: "Kelas 9A", kode_qr: "QR-KELAS-9A" },
  { nama_kelas: "Kelas 9B", kode_qr: "QR-KELAS-9B" },
  { nama_kelas: "Kelas 9C", kode_qr: "QR-KELAS-9C" },
  { nama_kelas: "Kelas 9D", kode_qr: "QR-KELAS-9D" },
];

const mataPelajaran = [
  "Matematika", "Bahasa Indonesia", "Ilmu Pengetahuan Alam", 
  "Ilmu Pengetahuan Sosial", "Bahasa Inggris", "Pendidikan Agama", 
  "PKn", "Seni Budaya", "PJOK", "Informatika"
];

const hariList = ["senin", "selasa", "rabu", "kamis", "jumat"];

const slotJam = [
  { jam_mulai: "07:00:00", jam_selesai: "08:30:00" },
  { jam_mulai: "08:30:00", jam_selesai: "10:00:00" },
  { jam_mulai: "10:15:00", jam_selesai: "11:45:00" },
  { jam_mulai: "12:30:00", jam_selesai: "14:00:00" },
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

  // 2. Ambil SEMUA data guru yang ada
  console.log("📌  Mengambil data guru...");
  const { data: guruList, error: guruError } = await db
    .from("guru")
    .select("id, nama, nip");

  if (guruError || !guruList || guruList.length === 0) {
    console.error("❌  Gagal mengambil data guru:", guruError?.message);
    process.exit(1);
  }
  console.log(`✅  ${guruList.length} guru ditemukan.\n`);

  // 3. Generate jadwal mengajar
  console.log("📌  Membuat jadwal mengajar...");
  const jadwalData = [];

  for (const guru of guruList) {
    // Berapa banyak jadwal untuk guru ini (3-5)
    const numJadwal = Math.floor(Math.random() * 3) + 3; 
    
    // Pilih hari acak tanpa duplikasi
    const shuffledHari = [...hariList].sort(() => 0.5 - Math.random());
    const hariTerpilih = shuffledHari.slice(0, numJadwal);
    
    // Pilih mapel spesifik untuk guru ini agar konsisten
    const mapelTerpilih = mataPelajaran[Math.floor(Math.random() * mataPelajaran.length)];

    for (const hari of hariTerpilih) {
      // Pilih kelas acak
      const kelas = insertedKelas![Math.floor(Math.random() * insertedKelas!.length)];
      // Pilih slot jam acak
      const slot = slotJam[Math.floor(Math.random() * slotJam.length)];

      jadwalData.push({
        guru_id: guru.id,
        kelas_id: kelas.id,
        mata_pelajaran: mapelTerpilih,
        hari: hari,
        jam_mulai: slot.jam_mulai,
        jam_selesai: slot.jam_selesai,
        status: "aktif",
      });
    }
  }

  // Karena generate random, ada kemungkinan konflik kelas di jam/hari yg sama. 
  // Kita coba masukkan saja dulu (bisa dibersihkan kalau ada unique constraint, 
  // tapi skema kita belum mendeclare unique jam+kelas).
  
  // Kosongkan jadwal lama dulu untuk mencegah penumpukan (opsional, tapi disarankan)
  console.log("📌  Menghapus jadwal lama (jika ada)...");
  await db.from("jadwal").delete().neq('id', '00000000-0000-0000-0000-000000000000'); // hacky delete all

  const { data: insertedJadwal, error: jadwalError } = await db
    .from("jadwal")
    .insert(jadwalData)
    .select("id");

  if (jadwalError) {
    console.error("❌  Gagal insert jadwal:", jadwalError.message);
  } else {
    console.log(`✅  ${insertedJadwal.length} jadwal berhasil dimasukkan.`);
  }

  console.log("\n🎉  Seeder kelas & jadwal selesai!\n");
}

seedKelasDanJadwal().catch(console.error);


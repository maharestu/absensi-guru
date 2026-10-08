"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export type ParsedData = {
  ptk: { nama: string; nip: string; nuptk: string; jenisPtk: string }[];
  legendaGuru: Record<string, string>;
  legendaMapel: Record<string, string>;
  kelases: string[];
  jadwals: {
    guruKode: string;
    mapelKode: string;
    kelasNama: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
  }[];
};

// Fungsi bantuan untuk membersihkan string
function cleanNameString(name: string) {
  if (!name) return "";
  let cleanName = name.split(",")[0];
  return cleanName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

// Fungsi pintar untuk mencocokkan nama (termasuk singkatan, misal: "Awaliatush S" == "Awaliatush Sholihah")
function isNameMatch(nameA: string, nameB: string) {
  const cleanA = cleanNameString(nameA);
  const cleanB = cleanNameString(nameB);

  if (cleanA === cleanB) return true;

  const tokensA = cleanA.split(/\s+/);
  const tokensB = cleanB.split(/\s+/);

  // Jika nama depan sama sekali tidak cocok, pasti beda orang
  if (tokensA[0] !== tokensB[0]) return false;

  // Jika nama depan cocok, cek kata-kata berikutnya
  for (let i = 0; i < Math.min(tokensA.length, tokensB.length); i++) {
    // Cek apakah token merupakan singkatan dari token lainnya (misal: "s" adalah singkatan "sholihah")
    if (!tokensA[i].startsWith(tokensB[i]) && !tokensB[i].startsWith(tokensA[i])) {
      return false;
    }
  }

  return true;
}

// Fungsi bantuan untuk membuat random NIP
function generateTempNip() {
  const random16 = Math.floor(Math.random() * 1e16).toString().padStart(16, "0");
  return `TEMP-${random16}`;
}

export async function importExcelData(data: ParsedData) {
  const supabase = supabaseAdmin;

  try {
    // Kumpulkan username yang sudah dipakai di DB agar tidak duplikat
    const { data: existingAkuns } = await supabase.from("akun").select("username");
    const usedUsernames = new Set(existingAkuns?.map(a => a.username) || []);

    const generateUniqueUsername = (nama: string) => {
      const parts = nama.split(",")[0].trim().split(/\s+/);
      let baseUsername = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (parts.length > 1) {
        const initial = parts[1][0].toLowerCase().replace(/[^a-z0-9]/g, "");
        if (initial) baseUsername += "." + initial;
      }
      
      let finalUsername = baseUsername;
      let counter = 1;
      while (usedUsernames.has(finalUsername)) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }
      usedUsernames.add(finalUsername);
      return finalUsername;
    };

    // ==========================================
    // TAHAP 1: PROSES DATA PTK (GURU & AKUN)
    // ==========================================
    
    // Ambil data guru yang sudah ada di database
    const { data: existingGurus, error: errGuru } = await supabase
      .from("guru")
      .select("id, nama, nip");
    if (errGuru) throw errGuru;

    const dbGuruList: any[] = [...(existingGurus || [])];
    const dbNipSet = new Set<string>(); // set of existing nips

    dbGuruList.forEach(g => {
      if (g.nip) dbNipSet.add(g.nip);
    });

    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    const gurusToInsert: any[] = [];
    const akunsToInsert: any[] = [];
    const ptksLolosFilter = data.ptk.filter(p => p.jenisPtk.toLowerCase().includes("guru"));

    for (const p of ptksLolosFilter) {
      // NIP Fallback Logic
      let finalNip = p.nip && p.nip !== "-" ? p.nip : p.nuptk && p.nuptk !== "-" ? p.nuptk : generateTempNip();
      
      const existingGuru = dbGuruList.find(g => isNameMatch(g.nama, p.nama));
      
      if (!existingGuru) {
        // Jika guru belum ada, siapkan untuk di-insert
        // pastikan nip belum dipakai oleh insert sebelumnya
        while (dbNipSet.has(finalNip)) {
          finalNip = generateTempNip();
        }
        dbNipSet.add(finalNip);

        gurusToInsert.push({
          nama: p.nama,
          nip: finalNip,
          jabatan: "Guru",
          status: "aktif"
        });
      }
    }

    // Insert Guru Baru dari PTK
    if (gurusToInsert.length > 0) {
      const { data: insertedGurus, error: insertGuruErr } = await supabase
        .from("guru")
        .insert(gurusToInsert)
        .select("id, nama, nip");

      if (insertGuruErr) throw insertGuruErr;

      // Siapkan akun untuk guru baru
      for (const g of insertedGurus || []) {
        dbGuruList.push(g); // Update list memori

        const finalUsername = generateUniqueUsername(g.nama);
        
        akunsToInsert.push({
          username: finalUsername,
          password_hash: defaultPasswordHash,
          role: "guru",
          nama: g.nama,
          status: "aktif",
          guru_id: g.id
        });
      }

      if (akunsToInsert.length > 0) {
        const { error: insertAkunErr } = await supabase
          .from("akun")
          .insert(akunsToInsert);
        if (insertAkunErr) console.error("Gagal membuat akun:", insertAkunErr);
      }
    }

    // ==========================================
    // TAHAP 2: PROSES DATA KELAS
    // ==========================================
    
    const { data: existingKelas, error: errKelas } = await supabase
      .from("kelas")
      .select("id, nama_kelas");
    if (errKelas) throw errKelas;

    const dbKelasMap = new Map<string, string>();
    existingKelas?.forEach(k => {
      dbKelasMap.set(k.nama_kelas.toLowerCase(), k.id);
    });

    const kelasesToInsert = data.kelases
      .filter(k => !dbKelasMap.has(k.toLowerCase()))
      .map(k => ({
        nama_kelas: k,
        kode_qr: crypto.randomUUID()
      }));

    if (kelasesToInsert.length > 0) {
      const { data: insertedKelases, error: insertKelasErr } = await supabase
        .from("kelas")
        .insert(kelasesToInsert)
        .select("id, nama_kelas");
      if (insertKelasErr) throw insertKelasErr;

      insertedKelases?.forEach(k => {
        dbKelasMap.set(k.nama_kelas.toLowerCase(), k.id);
      });
    }

    // ==========================================
    // TAHAP 3: PROSES DATA JADWAL (DENGAN FALLBACK GURU SILUMAN)
    // ==========================================
    
    // Ambil jadwal yang sudah ada untuk cek duplikasi
    const { data: existingJadwal, error: errJadwal } = await supabase
      .from("jadwal")
      .select("guru_id, kelas_id, mata_pelajaran, hari, jam_mulai, jam_selesai");
    if (errJadwal) throw errJadwal;

    const jadwalSet = new Set(
      existingJadwal?.map(j => `${j.guru_id}-${j.kelas_id}-${j.mata_pelajaran}-${j.hari}-${j.jam_mulai}-${j.jam_selesai}`)
    );

    const jadwalsToInsert: any[] = [];

    for (const j of data.jadwals) {
      const namaGuruDiLegenda = data.legendaGuru[j.guruKode];
      const namaMapelDiLegenda = data.legendaMapel[j.mapelKode] || j.mapelKode;
      const kelasId = dbKelasMap.get(j.kelasNama.toLowerCase());

      if (!namaGuruDiLegenda || !kelasId) continue;

      let guruDb = dbGuruList.find(g => isNameMatch(g.nama, namaGuruDiLegenda));

      // PENANGANAN GURU SILUMAN (GURU ADA DI JADWAL TAPI TIDAK ADA DI PTK)
      if (!guruDb) {
        const tempNip = generateTempNip();
        const { data: newGhostGuru, error: ghostErr } = await supabase
          .from("guru")
          .insert([{ nama: namaGuruDiLegenda, nip: tempNip, jabatan: "Guru", status: "aktif" }])
          .select("id, nama, nip")
          .single();
        
        if (ghostErr) {
          console.error("Gagal membuat guru siluman:", ghostErr);
          continue;
        }
        
        guruDb = newGhostGuru;
        dbGuruList.push(guruDb); // Masukkan ke list memori agar tidak dibuat ganda di iterasi jadwal berikutnya

        const finalUsernameGhost = generateUniqueUsername(guruDb.nama);

        // Buat akun juga
        await supabase.from("akun").insert([{
          username: finalUsernameGhost, // Pakai username format nama.inisial
          password_hash: defaultPasswordHash,
          role: "guru",
          nama: guruDb.nama,
          status: "aktif",
          guru_id: guruDb.id
        }]);
      }

      const hariEnum = j.hari.toLowerCase(); // 'senin', 'selasa', dst.
      const key = `${guruDb.id}-${kelasId}-${namaMapelDiLegenda}-${hariEnum}-${j.jamMulai}-${j.jamSelesai}`;

      // HANYA MASUKKAN JIKA JADWAL INI BELUM PERNAH ADA (SKIP DUPLIKAT)
      if (!jadwalSet.has(key)) {
        jadwalsToInsert.push({
          guru_id: guruDb.id,
          kelas_id: kelasId,
          mata_pelajaran: namaMapelDiLegenda,
          hari: hariEnum,
          jam_mulai: j.jamMulai,
          jam_selesai: j.jamSelesai,
          status: "aktif"
        });
        jadwalSet.add(key); // Cegah duplikasi di array insert itu sendiri
      }
    }

    if (jadwalsToInsert.length > 0) {
      // Supabase insert batch
      const { error: insertJadwalErr } = await supabase
        .from("jadwal")
        .insert(jadwalsToInsert);

      if (insertJadwalErr) throw insertJadwalErr;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan internal" };
  }
}

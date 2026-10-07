"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

type ParsedData = {
  gurus: { nip: string; nama: string; kode: string }[];
  kelases: { nama_kelas: string }[];
  jadwals: { 
    guruKode: string; 
    kelasNama: string; 
    mataPelajaran: string; 
    hari: string; 
    jamMulai: string; 
    jamSelesai: string; 
  }[];
};

export async function importExcelData(data: ParsedData) {
  const supabase = supabaseAdmin;

  try {
    // 1. Ambil data guru yang sudah ada
    const { data: existingGurus, error: errGuru } = await supabase
      .from("guru")
      .select("id, nama, nip");
    if (errGuru) throw errGuru;

    const guruNameToId: Record<string, string> = {};
    existingGurus?.forEach(g => {
      guruNameToId[g.nama.toLowerCase()] = g.id;
    });

    // Insert guru yang belum ada
    const newGurus = data.gurus.filter(g => !guruNameToId[g.nama.toLowerCase()]);
    if (newGurus.length > 0) {
      // Pastikan NIP unik dengan menggunakan timestamp + random
      const gurusToInsert = newGurus.map(g => ({
        nama: g.nama,
        nip: `NIP-TBD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: "aktif",
        jabatan: "Guru"
      }));

      const { data: insertedGurus, error: insertGuruErr } = await supabase
        .from("guru")
        .insert(gurusToInsert)
        .select("id, nama");

      if (insertGuruErr) throw insertGuruErr;

      // Otomatis buatkan Akun Login dengan default password
      try {
        const defaultPasswordHash = await bcrypt.hash("password123", 10);
        const generatedUsernames = new Set<string>();

        const akunsToInsert = insertedGurus.map(g => {
          // Buang gelar (setelah koma)
          const nameWithoutTitle = g.nama.split(',')[0].trim();
          const parts = nameWithoutTitle.split(/\s+/);
          
          let baseUsername = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
          if (parts.length > 1) {
            const initial = parts[1][0].toLowerCase().replace(/[^a-z0-9]/g, "");
            if (initial) {
              baseUsername += "." + initial;
            }
          }

          let finalUsername = baseUsername;
          let counter = 1;
          while (generatedUsernames.has(finalUsername)) {
            finalUsername = `${baseUsername}${counter}`;
            counter++;
          }
          generatedUsernames.add(finalUsername);

          return {
            username: finalUsername,
            password_hash: defaultPasswordHash,
            role: "guru",
            nama: g.nama,
            status: "aktif",
            guru_id: g.id
          };
        });

        const { error: insertAkunErr } = await supabase
          .from("akun")
          .insert(akunsToInsert);
        
        if (insertAkunErr) {
          console.error("Gagal membuat akun otomatis:", insertAkunErr);
        }
      } catch (akunErr) {
        console.error("Error hashing password:", akunErr);
      }

      insertedGurus?.forEach(g => {
        guruNameToId[g.nama.toLowerCase()] = g.id;
      });
    }

    // 2. Ambil data kelas yang sudah ada
    const { data: existingKelas, error: errKelas } = await supabase
      .from("kelas")
      .select("id, nama_kelas");
    if (errKelas) throw errKelas;

    const kelasNameToId: Record<string, string> = {};
    existingKelas?.forEach(k => {
      kelasNameToId[k.nama_kelas.toLowerCase()] = k.id;
    });

    // Insert kelas yang belum ada
    const newKelases = data.kelases.filter(k => !kelasNameToId[k.nama_kelas.toLowerCase()]);
    if (newKelases.length > 0) {
      const kelasesToInsert = newKelases.map(k => ({
        nama_kelas: k.nama_kelas,
        kode_qr: crypto.randomUUID() // Generate unik QR dengan UUID
      }));

      const { data: insertedKelases, error: insertKelasErr } = await supabase
        .from("kelas")
        .insert(kelasesToInsert)
        .select("id, nama_kelas");
      
      if (insertKelasErr) throw insertKelasErr;

      insertedKelases?.forEach(k => {
        kelasNameToId[k.nama_kelas.toLowerCase()] = k.id;
      });
    }

    // 3. Mapping Guru Kode (Excel) to Guru ID (DB)
    const excelKodeToDbGuruId: Record<string, string> = {};
    data.gurus.forEach(g => {
      const dbId = guruNameToId[g.nama.toLowerCase()];
      if (dbId) {
        excelKodeToDbGuruId[g.kode] = dbId;
      }
    });

    // 4. Proses Jadwal
    // Untuk menghindari duplikasi, kita ambil semua jadwal dan mencocokkan kombinasinya
    const { data: existingJadwal, error: errJadwal } = await supabase
      .from("jadwal")
      .select("id, guru_id, kelas_id, hari, jam_mulai, mata_pelajaran");
    if (errJadwal) throw errJadwal;

    const jadwalSet = new Set(
      existingJadwal?.map(j => `${j.guru_id}-${j.kelas_id}-${j.hari}-${j.jam_mulai}`)
    );

    const jadwalsToInsert: any[] = [];
    
    for (const j of data.jadwals) {
      const guruId = excelKodeToDbGuruId[j.guruKode];
      const kelasId = kelasNameToId[j.kelasNama.toLowerCase()];
      
      if (!guruId || !kelasId) continue;

      const hariEnum = j.hari.toLowerCase(); // 'senin', 'selasa', dst.
      
      // key untuk mengecek duplikasi
      const key = `${guruId}-${kelasId}-${hariEnum}-${j.jamMulai}`;
      
      if (!jadwalSet.has(key)) {
        jadwalsToInsert.push({
          guru_id: guruId,
          kelas_id: kelasId,
          mata_pelajaran: j.mataPelajaran,
          hari: hariEnum,
          jam_mulai: j.jamMulai,
          jam_selesai: j.jamSelesai,
          status: "aktif"
        });
        jadwalSet.add(key); // Mencegah duplikasi dalam array insert itu sendiri
      }
    }

    // Insert batch jadwal baru
    if (jadwalsToInsert.length > 0) {
      // Supabase insert ada limit size, tapi 300 row biasanya aman dalam 1 request
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

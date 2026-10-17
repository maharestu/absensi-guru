"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/session";
import { cleanNameString, isNameMatch } from "@/lib/name-matcher";

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

// Fungsi bantuan untuk membuat random NIP
function generateTempNip() {
  const random16 = Math.floor(Math.random() * 1e16).toString().padStart(16, "0");
  return `TEMP-${random16}`;
}

import { normalizeTimeString } from "@/lib/format";

const normKelas = (nama: string) => (nama || "").trim().toUpperCase();
const normMapel = (m: string) => (m || "").trim().toUpperCase();

export async function importExcelData(data: ParsedData) {
  await requireAdmin();
  const supabase = supabaseAdmin;

  try {
    // ==========================================
    // TAHAP 1: PROSES DATA PTK (GURU & AKUN)
    // ==========================================

    // Kumpulkan seluruh akun yang sudah ada untuk mencegah duplikasi username dan akun
    const { data: existingAkuns, error: errAkun } = await supabase
      .from("akun")
      .select("id, username, guru_id, role");
    if (errAkun) throw errAkun;

    const usedUsernames = new Set(existingAkuns?.map((a) => a.username) || []);
    const existingAkunByGuruId = new Map<string, any>();
    existingAkuns?.forEach((a) => {
      if (a.guru_id) existingAkunByGuruId.set(a.guru_id, a);
    });

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

    // Ambil data guru yang sudah ada di database
    const { data: existingGurus, error: errGuru } = await supabase
      .from("guru")
      .select("id, nama, nip, status");
    if (errGuru) throw errGuru;

    const dbGuruList: any[] = [...(existingGurus || [])];
    const dbNipSet = new Set<string>();
    dbGuruList.forEach((g) => {
      if (g.nip) dbNipSet.add(g.nip);
    });

    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    const gurusToInsert: any[] = [];
    const gurusToUpdate: { id: string; nama?: string; nip?: string }[] = [];
    const akunsToInsert: any[] = [];

    const ptksLolosFilter = data.ptk.filter((p) =>
      p.jenisPtk.toLowerCase().includes("guru")
    );

    for (const p of ptksLolosFilter) {
      const rawNip =
        p.nip && p.nip !== "-"
          ? p.nip.trim()
          : p.nuptk && p.nuptk !== "-"
          ? p.nuptk.trim()
          : "";

      let finalName = p.nama;
      const kbmNameEntry = Object.values(data.legendaGuru).find((kn) =>
        isNameMatch(kn, p.nama)
      );
      if (kbmNameEntry && kbmNameEntry.includes(",") && !finalName.includes(",")) {
        finalName = kbmNameEntry;
      }

      // 1) Cek apakah guru sudah ada berdasarkan NIP resmi (jika valid bukan TEMP-)
      let existingGuru =
        rawNip && !rawNip.startsWith("TEMP-")
          ? dbGuruList.find((g) => g.nip === rawNip)
          : undefined;

      // 2) Jika belum ditemukan lewat NIP, cek lewat kecocokan nama pintar
      if (!existingGuru) {
        existingGuru = dbGuruList.find((g) => isNameMatch(g.nama, p.nama));
      }

      if (existingGuru) {
        // Guru sudah ada di DB — cek apakah ada pembaruan (NIP resmi baru atau nama bergelar)
        const updates: any = {};
        if (
          rawNip &&
          !rawNip.startsWith("TEMP-") &&
          (!existingGuru.nip || existingGuru.nip.startsWith("TEMP-"))
        ) {
          updates.nip = rawNip;
          existingGuru.nip = rawNip;
          dbNipSet.add(rawNip);
        }
        if (!existingGuru.nama.includes(",") && finalName.includes(",")) {
          updates.nama = finalName;
          existingGuru.nama = finalName;
        }
        if (Object.keys(updates).length > 0) {
          gurusToUpdate.push({ id: existingGuru.id, ...updates });
        }

        // Cek apakah guru yang ada ini sudah punya akun login
        if (!existingAkunByGuruId.has(existingGuru.id)) {
          const finalUsername = generateUniqueUsername(existingGuru.nama);
          akunsToInsert.push({
            username: finalUsername,
            password_hash: defaultPasswordHash,
            role: "guru",
            nama: existingGuru.nama,
            status: "aktif",
            guru_id: existingGuru.id,
          });
          existingAkunByGuruId.set(existingGuru.id, true);
        }
      } else {
        // Guru benar-benar baru, siapkan insert
        let finalNip = rawNip || generateTempNip();
        while (dbNipSet.has(finalNip)) {
          finalNip = generateTempNip();
        }
        dbNipSet.add(finalNip);

        gurusToInsert.push({
          nama: finalName,
          nip: finalNip,
          jabatan: "Guru",
          status: "aktif",
        });
      }
    }

    // Jalankan pembaruan data guru yang sudah ada secara paralel
    if (gurusToUpdate.length > 0) {
      await Promise.all(
        gurusToUpdate.map((g) => {
          const { id, ...dataToUpdate } = g;
          return supabase.from("guru").update(dataToUpdate).eq("id", id);
        })
      );
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
        dbGuruList.push(g);

        if (!existingAkunByGuruId.has(g.id)) {
          const finalUsername = generateUniqueUsername(g.nama);
          akunsToInsert.push({
            username: finalUsername,
            password_hash: defaultPasswordHash,
            role: "guru",
            nama: g.nama,
            status: "aktif",
            guru_id: g.id,
          });
          existingAkunByGuruId.set(g.id, true);
        }
      }
    }

    // Eksekusi insert akun baru jika ada (tidak menduplikasi akun yang sudah ada)
    if (akunsToInsert.length > 0) {
      const { error: insertAkunErr } = await supabase
        .from("akun")
        .insert(akunsToInsert);
      if (insertAkunErr) console.error("Gagal membuat akun:", insertAkunErr);
    }

    // ==========================================
    // TAHAP 2: PROSES DATA KELAS (IDEMPOTENT & PRESERVE QR)
    // ==========================================

    const { data: existingKelas, error: errKelas } = await supabase
      .from("kelas")
      .select("id, nama_kelas, kode_qr");
    if (errKelas) throw errKelas;

    const dbKelasMap = new Map<string, string>();
    existingKelas?.forEach((k) => {
      dbKelasMap.set(normKelas(k.nama_kelas), k.id);
    });

    const kelasesToInsert = data.kelases
      .filter((k) => !dbKelasMap.has(normKelas(k)))
      .map((k) => ({
        nama_kelas: normKelas(k),
        kode_qr: crypto.randomUUID(),
      }));

    if (kelasesToInsert.length > 0) {
      const { data: insertedKelases, error: insertKelasErr } = await supabase
        .from("kelas")
        .insert(kelasesToInsert)
        .select("id, nama_kelas");
      if (insertKelasErr) throw insertKelasErr;

      insertedKelases?.forEach((k) => {
        dbKelasMap.set(normKelas(k.nama_kelas), k.id);
      });
    }

    // ==========================================
    // TAHAP 3: GURU KBM NON-PTK (HONORER / PENGGANTI)
    // ==========================================

    const missingGuruNamesSet = new Set<string>();
    for (const j of data.jadwals) {
      const namaGuruDiLegenda = data.legendaGuru[j.guruKode];
      if (
        namaGuruDiLegenda &&
        !dbGuruList.some((g) => isNameMatch(g.nama, namaGuruDiLegenda))
      ) {
        missingGuruNamesSet.add(namaGuruDiLegenda);
      }
    }

    if (missingGuruNamesSet.size > 0) {
      const ghostGurusToInsert = Array.from(missingGuruNamesSet).map((name) => {
        let tempNip = generateTempNip();
        while (dbNipSet.has(tempNip)) {
          tempNip = generateTempNip();
        }
        dbNipSet.add(tempNip);
        return {
          nama: name,
          nip: tempNip,
          jabatan: "Guru",
          status: "aktif",
        };
      });

      const { data: insertedGhostGurus, error: ghostErr } = await supabase
        .from("guru")
        .insert(ghostGurusToInsert)
        .select("id, nama, nip");

      if (ghostErr) {
        console.error("Gagal batch insert guru luar PTK:", ghostErr);
      } else if (insertedGhostGurus) {
        const ghostAkunsToInsert: any[] = [];
        for (const g of insertedGhostGurus) {
          dbGuruList.push(g);
          if (!existingAkunByGuruId.has(g.id)) {
            const finalUsernameGhost = generateUniqueUsername(g.nama);
            ghostAkunsToInsert.push({
              username: finalUsernameGhost,
              password_hash: defaultPasswordHash,
              role: "guru",
              nama: g.nama,
              status: "aktif",
              guru_id: g.id,
            });
            existingAkunByGuruId.set(g.id, true);
          }
        }
        if (ghostAkunsToInsert.length > 0) {
          const { error: ghostAkunErr } = await supabase
            .from("akun")
            .insert(ghostAkunsToInsert);
          if (ghostAkunErr)
            console.error("Gagal batch insert akun guru luar PTK:", ghostAkunErr);
        }
      }
    }

    // ==========================================
    // TAHAP 4: PROSES DATA JADWAL (ANTI-DUPLIKASI & ANTI-OVERLAPPING SLOT)
    // ==========================================

    const { data: existingJadwal, error: errJadwal } = await supabase
      .from("jadwal")
      .select("id, guru_id, kelas_id, mata_pelajaran, hari, jam_mulai, jam_selesai");
    if (errJadwal) throw errJadwal;

    // 1. Exact match set: idempoten jika jadwal persis sama diimport ulang
    const exactJadwalSet = new Set(
      existingJadwal?.map(
        (j) =>
          `${j.guru_id}-${j.kelas_id}-${normMapel(j.mata_pelajaran)}-${j.hari.toLowerCase()}-${normalizeTimeString(j.jam_mulai)}-${normalizeTimeString(j.jam_selesai)}`
      )
    );

    // 2. Slot map: 1 kelas pada hari dan jam tersebut hanya boleh ada 1 jadwal
    const slotMap = new Map<string, any>();
    existingJadwal?.forEach((j) => {
      const slotKey = `${j.kelas_id}-${j.hari.toLowerCase()}-${normalizeTimeString(j.jam_mulai)}-${normalizeTimeString(j.jam_selesai)}`;
      slotMap.set(slotKey, j);
    });

    const jadwalsToInsert: any[] = [];
    const jadwalsToUpdate: { id: string; guru_id: string; mata_pelajaran: string }[] = [];
    const inFlightSlotSet = new Set<string>();

    for (const j of data.jadwals) {
      const namaGuruDiLegenda = data.legendaGuru[j.guruKode];
      const namaMapelDiLegenda = data.legendaMapel[j.mapelKode] || j.mapelKode;
      const kelasId = dbKelasMap.get(normKelas(j.kelasNama));

      if (!namaGuruDiLegenda || !kelasId) continue;

      const guruDb = dbGuruList.find((g) => isNameMatch(g.nama, namaGuruDiLegenda));
      if (!guruDb) continue;

      const hariEnum = j.hari.toLowerCase();
      const jamMulaiNorm = normalizeTimeString(j.jamMulai);
      const jamSelesaiNorm = normalizeTimeString(j.jamSelesai);

      const exactKey = `${guruDb.id}-${kelasId}-${normMapel(namaMapelDiLegenda)}-${hariEnum}-${jamMulaiNorm}-${jamSelesaiNorm}`;
      const slotKey = `${kelasId}-${hariEnum}-${jamMulaiNorm}-${jamSelesaiNorm}`;

      // A. Jika jadwal persis sama sudah ada di DB, lewati (100% idempoten)
      if (exactJadwalSet.has(exactKey)) {
        continue;
      }

      // B. Jika slot ruang kelas pada hari & jam ini sudah ada di DB tetapi beda guru/mapel:
      // Update jadwal yang sudah ada (menghindari jam kembar/data rusak di kelas yang sama)
      if (slotMap.has(slotKey)) {
        const existingRow = slotMap.get(slotKey);
        jadwalsToUpdate.push({
          id: existingRow.id,
          guru_id: guruDb.id,
          mata_pelajaran: namaMapelDiLegenda,
        });
        exactJadwalSet.add(exactKey);
        continue;
      }

      // C. Jika slot baru dan belum pernah masuk di antrean batch ini:
      if (!inFlightSlotSet.has(slotKey)) {
        inFlightSlotSet.add(slotKey);
        exactJadwalSet.add(exactKey);
        jadwalsToInsert.push({
          guru_id: guruDb.id,
          kelas_id: kelasId,
          mata_pelajaran: namaMapelDiLegenda,
          hari: hariEnum,
          jam_mulai: jamMulaiNorm,
          jam_selesai: jamSelesaiNorm,
          status: "aktif",
        });
      }
    }

    // Jalankan update jadwal secara paralel jika ada pembaruan slot
    if (jadwalsToUpdate.length > 0) {
      await Promise.all(
        jadwalsToUpdate.map((j) =>
          supabase
            .from("jadwal")
            .update({ guru_id: j.guru_id, mata_pelajaran: j.mata_pelajaran })
            .eq("id", j.id)
        )
      );
    }

    // Batch insert jadwal baru
    if (jadwalsToInsert.length > 0) {
      const { error: insertJadwalErr } = await supabase
        .from("jadwal")
        .insert(jadwalsToInsert);

      if (insertJadwalErr) throw insertJadwalErr;
    }

    return {
      success: true,
      stats: {
        gurusInserted: gurusToInsert.length,
        gurusUpdated: gurusToUpdate.length,
        akunsInserted: akunsToInsert.length,
        kelasesInserted: kelasesToInsert.length,
        jadwalsInserted: jadwalsToInsert.length,
        jadwalsUpdated: jadwalsToUpdate.length,
      },
    };
  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan internal" };
  }
}

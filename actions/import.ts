"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/session";
import { cleanNameString, isNameMatch } from "@/lib/name-matcher";

export type ParsedData = {
  ptk: {
    nama: string;
    nip: string;
    nuptk: string;
    jenisPtk: string;
    noTelepon?: string;
    jabatan?: string;
  }[];
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
      .select("id, username, guru_id, role, status, nama");
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
      .select("id, nama, nip, status, no_telepon, jabatan");
    if (errGuru) throw errGuru;

    const dbGuruList: any[] = [...(existingGurus || [])];
    const dbNipSet = new Set<string>();
    dbGuruList.forEach((g) => {
      if (g.nip) dbNipSet.add(g.nip);
    });

    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    const gurusToInsert: any[] = [];
    const gurusToUpdate: {
      id: string;
      nama?: string;
      nip?: string;
      status?: string;
      no_telepon?: string | null;
      jabatan?: string | null;
    }[] = [];
    const akunsToInsert: any[] = [];
    const akunsToUpdate: { id: string; status?: string; nama?: string }[] = [];

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
        // Guru sudah ada di DB — sesuaikan seluruh data dengan data terbaru dari Excel (Import-First Priority)
        const updates: any = {};

        // 1. Status: Selalu pastikan status aktif sesuai data import
        if (existingGuru.status !== "aktif") {
          updates.status = "aktif";
          existingGuru.status = "aktif";
        }

        // 2. NIP: Perbarui jika ada NIP resmi di Excel dan berbeda dari NIP di DB
        if (rawNip && !rawNip.startsWith("TEMP-") && existingGuru.nip !== rawNip) {
          const isNipUsedByOther = dbGuruList.some(
            (g) => g.id !== existingGuru.id && g.nip === rawNip
          );
          if (!isNipUsedByOther) {
            if (existingGuru.nip) dbNipSet.delete(existingGuru.nip);
            updates.nip = rawNip;
            existingGuru.nip = rawNip;
            dbNipSet.add(rawNip);
          }
        } else if (!rawNip && existingGuru.nip && !existingGuru.nip.startsWith("TEMP-")) {
          // Di file Excel TIDAK ADA NIP/NUPTK (kosong / "-"), tapi di DB sebelumnya ada NIP resmi (misal editan manual di dashboard):
          // Kembalikan ke NIP sementara (TEMP-) sesuai data import yang memang tidak punya NIP
          let tempNip = generateTempNip();
          while (dbNipSet.has(tempNip)) {
            tempNip = generateTempNip();
          }
          if (existingGuru.nip) dbNipSet.delete(existingGuru.nip);
          updates.nip = tempNip;
          existingGuru.nip = tempNip;
          dbNipSet.add(tempNip);
        }

        // 3. Nama: Perbarui jika nama di Excel berbeda
        if (finalName && finalName !== existingGuru.nama) {
          updates.nama = finalName;
          existingGuru.nama = finalName;
        }

        // 4. Nomor Telepon: Sesuaikan sepenuhnya dengan Excel (jika di Excel kosong, kembalikan ke null/kosong di DB)
        const incomingNoTelepon = (p.noTelepon && p.noTelepon !== "-" && p.noTelepon !== "0") ? p.noTelepon : null;
        if (incomingNoTelepon !== (existingGuru.no_telepon || null)) {
          updates.no_telepon = incomingNoTelepon;
          existingGuru.no_telepon = incomingNoTelepon;
        }

        // 5. Jabatan: Sesuaikan dengan Excel (default 'Guru' jika kosong)
        const incomingJabatan = (p.jabatan && p.jabatan !== "-") ? p.jabatan : "Guru";
        if (incomingJabatan !== (existingGuru.jabatan || "Guru")) {
          updates.jabatan = incomingJabatan;
          existingGuru.jabatan = incomingJabatan;
        }

        if (Object.keys(updates).length > 0) {
          gurusToUpdate.push({ id: existingGuru.id, ...updates });
        }

        // Cek apakah guru yang ada ini sudah punya akun login
        const existingAkun = existingAkunByGuruId.get(existingGuru.id);
        if (existingAkun) {
          const akunUpdates: any = {};
          if (existingAkun.status !== "aktif") {
            akunUpdates.status = "aktif";
            existingAkun.status = "aktif";
          }
          if (updates.nama && existingAkun.nama !== updates.nama) {
            akunUpdates.nama = updates.nama;
            existingAkun.nama = updates.nama;
          }
          if (Object.keys(akunUpdates).length > 0) {
            akunsToUpdate.push({ id: existingAkun.id, ...akunUpdates });
          }
        } else {
          const finalUsername = generateUniqueUsername(existingGuru.nama);
          akunsToInsert.push({
            username: finalUsername,
            password_hash: defaultPasswordHash,
            role: "guru",
            nama: existingGuru.nama,
            status: "aktif",
            guru_id: existingGuru.id,
          });
          existingAkunByGuruId.set(existingGuru.id, {
            id: null,
            username: finalUsername,
            role: "guru",
            nama: existingGuru.nama,
            status: "aktif",
            guru_id: existingGuru.id,
          });
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
          jabatan: p.jabatan || "Guru",
          no_telepon: p.noTelepon || null,
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

    // Jalankan pembaruan data akun yang sudah ada (re-aktivasi status / nama)
    if (akunsToUpdate.length > 0) {
      await Promise.all(
        akunsToUpdate.map((a) => {
          const { id, ...dataToUpdate } = a;
          return supabase.from("akun").update(dataToUpdate).eq("id", id);
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
          existingAkunByGuruId.set(g.id, {
            username: finalUsername,
            role: "guru",
            nama: g.nama,
            status: "aktif",
            guru_id: g.id,
          });
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
      if (!namaGuruDiLegenda) continue;

      const matchedDbGuru = dbGuruList.find((g) => isNameMatch(g.nama, namaGuruDiLegenda));
      if (!matchedDbGuru) {
        missingGuruNamesSet.add(namaGuruDiLegenda);
      } else if (matchedDbGuru.status !== "aktif") {
        // Guru KBM sudah ada di DB tapi berstatus nonaktif, aktifkan kembali
        matchedDbGuru.status = "aktif";
        await supabase.from("guru").update({ status: "aktif" }).eq("id", matchedDbGuru.id);

        const existingAkun = existingAkunByGuruId.get(matchedDbGuru.id);
        if (existingAkun && typeof existingAkun === "object" && existingAkun.status !== "aktif") {
          existingAkun.status = "aktif";
          await supabase.from("akun").update({ status: "aktif" }).eq("id", existingAkun.id);
        }
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
            existingAkunByGuruId.set(g.id, {
              username: finalUsernameGhost,
              role: "guru",
              nama: g.nama,
              status: "aktif",
              guru_id: g.id,
            });
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
      .select("id, guru_id, kelas_id, mata_pelajaran, hari, jam_mulai, jam_selesai, status");
    if (errJadwal) throw errJadwal;

    // 1. Exact match map: simpan data jadwal persis sama di DB
    const exactJadwalMap = new Map<string, any>();
    existingJadwal?.forEach((j) => {
      const exactKey = `${j.guru_id}-${j.kelas_id}-${normMapel(j.mata_pelajaran)}-${j.hari.toLowerCase()}-${normalizeTimeString(j.jam_mulai)}-${normalizeTimeString(j.jam_selesai)}`;
      exactJadwalMap.set(exactKey, j);
    });

    // 2. Slot map: 1 kelas pada hari dan jam tersebut hanya boleh ada 1 jadwal
    const slotMap = new Map<string, any>();
    existingJadwal?.forEach((j) => {
      const slotKey = `${j.kelas_id}-${j.hari.toLowerCase()}-${normalizeTimeString(j.jam_mulai)}-${normalizeTimeString(j.jam_selesai)}`;
      slotMap.set(slotKey, j);
    });

    const jadwalsToInsert: any[] = [];
    const jadwalsToUpdate: { id: string; guru_id: string; mata_pelajaran: string; status?: string }[] = [];
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

      // A. Jika jadwal persis sama sudah ada di DB:
      if (exactJadwalMap.has(exactKey)) {
        const existingExact = exactJadwalMap.get(exactKey);
        // IMPORT-FIRST: Jika jadwal persis sama ada di DB tapi statusnya nonaktif, aktifkan kembali!
        if (existingExact && existingExact.status !== "aktif") {
          jadwalsToUpdate.push({
            id: existingExact.id,
            guru_id: guruDb.id,
            mata_pelajaran: namaMapelDiLegenda,
            status: "aktif",
          });
          existingExact.status = "aktif";
        }
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
          status: "aktif",
        });
        exactJadwalMap.set(exactKey, { ...existingRow, status: "aktif" });
        continue;
      }

      // C. Jika slot baru dan belum pernah masuk di antrean batch ini:
      if (!inFlightSlotSet.has(slotKey)) {
        inFlightSlotSet.add(slotKey);
        exactJadwalMap.set(exactKey, { id: null, status: "aktif" });
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

    // Jalankan update jadwal secara paralel jika ada pembaruan slot atau re-aktivasi status
    if (jadwalsToUpdate.length > 0) {
      await Promise.all(
        jadwalsToUpdate.map((j) => {
          const { id, ...dataToUpdate } = j;
          return supabase
            .from("jadwal")
            .update(dataToUpdate)
            .eq("id", id);
        })
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
        akunsUpdated: akunsToUpdate.length,
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

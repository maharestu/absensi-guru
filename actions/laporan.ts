"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { formatJamWIB, getTodayWIB, isWeekendWIB, isPastCutoffTodayWIB, TANGGAL_MULAI_TIDAK_HADIR, TANGGAL_MULAI_TIDAK_MENGAJAR, getJamWIB, toDateStrWIB } from "@/lib/date";

export interface LaporanKehadiran {
  id: string;
  guru_id: string;
  tanggal: string;
  raw_tanggal?: string;
  nama: string;
  waktu_masuk: string;
  waktu_pulang?: string;
  status: string;
  foto_absensi?: string | null;
  file_bukti_izin_sakit?: string | null;
}

export interface LaporanMengajar {
  id: string;
  guru_id: string;
  kelas_id: string;
  jadwal_id?: string;
  tanggal: string;
  raw_tanggal?: string;
  nama: string;
  kelas: string;
  mata_pelajaran: string;
  waktu: string;
  waktu_submit?: string | null;
  waktu_absen?: string | null;
  status: string;
  foto_absensi?: string | null;
}

export async function getLaporanKehadiran(startDate?: string, endDate?: string): Promise<LaporanKehadiran[]> {
  let query = supabaseAdmin
    .from("absensi_masuk")
    .select("id, guru_id, tanggal, waktu_submit, waktu_pulang, status, foto_absensi, file_bukti_izin_sakit, guru(nama)")
    .order("waktu_submit", { ascending: false })
    .limit(1500);

  if (startDate) query = query.gte("tanggal", startDate);
  if (endDate) query = query.lte("tanggal", endDate);

  const [absensiRes, guruRes, hariLiburRes, pengaturanRes, earliestActiveRes] = await Promise.all([
    query,
    supabaseAdmin.from("guru").select("id, nama, created_at").eq("status", "aktif"),
    supabaseAdmin.from("hari_libur").select("tanggal"),
    supabaseAdmin.from("pengaturan_sistem").select("jam_cutoff, libur_panjang_aktif, libur_panjang_mulai, libur_panjang_selesai").maybeSingle(),
    supabaseAdmin
      .from("absensi_masuk")
      .select("tanggal")
      .in("status", ["hadir", "izin", "sakit", "dinas"])
      .order("tanggal", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (absensiRes.error) throw new Error(absensiRes.error.message);
  if (guruRes.error) throw new Error(guruRes.error.message);

  // Guard 2: Cek apakah sudah pernah ada aktivitas absensi riil di sekolah
  const earliestActiveDate = earliestActiveRes.data?.tanggal
    ? (typeof earliestActiveRes.data.tanggal === "string" ? earliestActiveRes.data.tanggal.slice(0, 10) : "")
    : null;

  if (!earliestActiveDate) {
    // Belum pernah ada satupun guru yang absen mandiri/izin/sakit/dinas di sistem.
    // Bersihkan data 'tidak_hadir' prematur yang mungkin terlanjur tersimpan di database
    try {
      await supabaseAdmin.from("absensi_masuk").delete().eq("status", "tidak_hadir");
    } catch (e) {
      console.error("Gagal membersihkan data tidak hadir prematur:", e);
    }
    return [];
  }

  const activeGurus = guruRes.data ?? [];
  const guruCreatedMap = new Map<string, string>();
  for (const g of activeGurus) {
    if ((g as any).created_at) {
      guruCreatedMap.set(g.id, toDateStrWIB((g as any).created_at));
    }
  }

  // Identifikasi dan bersihkan record 'tidak_hadir' prematur (tanggal < earliestActiveDate ATAU tanggal < guru.created_at)
  const invalidTidakHadirIds: string[] = [];
  const validAbsensiRows = (absensiRes.data ?? []).filter((row: any) => {
    if (row.status === "tidak_hadir") {
      const tStr = typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "";
      const gCreated = row.guru_id ? guruCreatedMap.get(row.guru_id) : undefined;
      if (tStr < earliestActiveDate || (gCreated && tStr < gCreated)) {
        invalidTidakHadirIds.push(row.id);
        return false;
      }
    }
    return true;
  });

  if (invalidTidakHadirIds.length > 0) {
    try {
      await supabaseAdmin.from("absensi_masuk").delete().in("id", invalidTidakHadirIds);
    } catch (err) {
      console.error("Gagal menghapus rekaman tidak hadir prematur:", err);
    }
  }

  const holidaySet = new Set<string>(
    (hariLiburRes.data ?? []).map((h: any) => (typeof h.tanggal === "string" ? h.tanggal.slice(0, 10) : ""))
  );
  const lp = pengaturanRes.data;
  const isDateInLiburPanjang = (dateStr: string) => {
    if (!lp?.libur_panjang_aktif || !lp?.libur_panjang_mulai || !lp?.libur_panjang_selesai) return false;
    return dateStr >= lp.libur_panjang_mulai && dateStr <= lp.libur_panjang_selesai;
  };

  const realRecords: LaporanKehadiran[] = validAbsensiRows.map((row: any) => {
    const isTidakHadir = row.status === "tidak_hadir";
    return {
      id: row.id,
      guru_id: row.guru_id ?? "",
      tanggal: new Date(row.tanggal).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      raw_tanggal: typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "",
      nama: Array.isArray(row.guru) ? row.guru[0]?.nama : (row.guru?.nama ?? "-"),
      waktu_masuk: (isTidakHadir || !row.waktu_submit)
        ? "—"
        : formatJamWIB(row.waktu_submit),
      waktu_pulang: (isTidakHadir || !row.waktu_pulang)
        ? "—"
        : formatJamWIB(row.waktu_pulang),
      status: isTidakHadir ? "Tidak Hadir" : (row.status.charAt(0).toUpperCase() + row.status.slice(1)),
      foto_absensi: row.foto_absensi,
      file_bukti_izin_sakit: row.file_bukti_izin_sakit
    };
  });

  // Rekonsiliasi data "Tidak Hadir" jika periode startDate & endDate ditentukan
  if (startDate && endDate) {
    const todayWIB = getTodayWIB();
    const cutoffJam = (pengaturanRes.data as any)?.jam_cutoff ? String((pengaturanRes.data as any).jam_cutoff).slice(0, 5) : "16:00";
    const isPastCutoff = isPastCutoffTodayWIB(cutoffJam);

    // Map pencocokan absensi: key = `${guru_id}_${tanggal}`
    const existingSet = new Set<string>();
    for (const row of validAbsensiRows) {
      if (row.guru_id && row.tanggal) {
        const tStr = typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "";
        existingSet.add(`${row.guru_id}_${tStr}`);
      }
    }

    // Iterasi deretan tanggal dari startDate sampai endDate
    const dates: string[] = [];
    const [sY, sM, sD] = startDate.split("-").map(Number);
    const [eY, eM, eD] = endDate.split("-").map(Number);
    const cur = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0));
    const end = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0));

    while (cur <= end) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
      const d = String(cur.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const missingRecords: { guru_id: string; tanggal: string; status: "tidak_hadir"; waktu_submit: string }[] = [];

    for (const dateStr of dates) {
      // 1. Lewati tanggal sebelum fitur Tidak Hadir resmi berlaku
      if (dateStr < TANGGAL_MULAI_TIDAK_HADIR) continue;

      // 1b. Lewati tanggal sebelum aktivitas absensi perdana di sekolah
      if (dateStr < earliestActiveDate) continue;

      // 2. Lewati akhir pekan (Sabtu & Minggu bukan hari sekolah)
      if (isWeekendWIB(dateStr)) continue;

      // 3. Lewati hari libur nasional / sekolah & libur panjang (laporan dibiarkan kosong sama seperti akhir pekan)
      if (holidaySet.has(dateStr) || isDateInLiburPanjang(dateStr)) continue;

      // 4. Lewati tanggal di masa depan
      if (dateStr > todayWIB) continue;

      // 5. Untuk hari ini, belum absen baru dianggap "Tidak Hadir" setelah jam cut-off dinamis dari database
      if (dateStr === todayWIB && !isPastCutoff) continue;

      // Periksa setiap guru aktif
      for (const guru of activeGurus) {
        // Guard 1: Jangan tandai Tidak Hadir jika tanggal evaluasi sebelum guru didaftarkan
        const guruCreatedDateStr = guruCreatedMap.get(guru.id);
        if (guruCreatedDateStr && dateStr < guruCreatedDateStr) {
          continue;
        }

        const key = `${guru.id}_${dateStr}`;
        if (!existingSet.has(key)) {
          missingRecords.push({
            guru_id: guru.id,
            tanggal: dateStr,
            status: "tidak_hadir",
            waktu_submit: `${dateStr}T${cutoffJam}:00+07:00`,
          });
          existingSet.add(key);
        }
      }
    }

    const guruMap = new Map<string, string>();
    activeGurus.forEach((g) => guruMap.set(g.id, g.nama ?? "-"));

    const persistedRows: LaporanKehadiran[] = [];

    if (missingRecords.length > 0) {
      try {
        await supabaseAdmin
          .from("absensi_masuk")
          .upsert(missingRecords, { onConflict: "guru_id, tanggal", ignoreDuplicates: true });

        // Ambil data riil langsung dari database dengan join nama guru
        const datesToFetch = Array.from(new Set(missingRecords.map((m) => m.tanggal)));
        const { data: dbRecords } = await supabaseAdmin
          .from("absensi_masuk")
          .select("id, guru_id, tanggal, waktu_submit, waktu_pulang, status, foto_absensi, file_bukti_izin_sakit, guru(nama)")
          .in("guru_id", missingRecords.map((m) => m.guru_id))
          .in("tanggal", datesToFetch)
          .eq("status", "tidak_hadir");

        if (dbRecords && dbRecords.length > 0) {
          for (const row of dbRecords as any[]) {
            const [yr, mo, da] = String(row.tanggal).slice(0, 10).split("-").map(Number);
            const dObj = new Date(Date.UTC(yr, mo - 1, da, 12, 0, 0));
            const guruObj = row.guru;
            const guruNama = Array.isArray(guruObj) ? guruObj[0]?.nama : (guruObj?.nama ?? guruMap.get(row.guru_id) ?? "-");
            persistedRows.push({
              id: row.id, // 100% ID asli dari database Supabase
              guru_id: row.guru_id,
              tanggal: dObj.toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "2-digit",
                month: "short",
                year: "numeric"
              }),
              raw_tanggal: String(row.tanggal).slice(0, 10),
              nama: guruNama,
              waktu_masuk: "—",
              waktu_pulang: "—",
              status: "Tidak Hadir",
              foto_absensi: null,
              file_bukti_izin_sakit: null
            });
          }
        }
      } catch (err) {
        console.error("Gagal melakukan batch upsert tidak hadir ke database:", err);
      }
    }

    const combined = [...realRecords, ...persistedRows];
    // Urutkan berdasarkan tanggal terbaru lalu abjad nama guru
    combined.sort((a, b) => {
      const dateA = a.raw_tanggal || "";
      const dateB = b.raw_tanggal || "";
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return a.nama.localeCompare(b.nama);
    });

    return combined;
  }

  return realRecords;
}

export async function getLaporanMengajar(startDate?: string, endDate?: string): Promise<LaporanMengajar[]> {
  let query = supabaseAdmin
    .from("absensi_mengajar")
    .select("id, tanggal, waktu_submit, status, foto_absensi, jadwal_id, jadwal(id, mata_pelajaran, jam_mulai, jam_selesai, guru_id, kelas_id, guru(nama), kelas(nama_kelas))")
    .order("waktu_submit", { ascending: false })
    .limit(1500);

  if (startDate) query = query.gte("tanggal", startDate);
  if (endDate) query = query.lte("tanggal", endDate);

  const [absensiRes, jadwalRes, hariLiburRes, pengaturanRes, earliestMengajarRes, guruRes] = await Promise.all([
    query,
    supabaseAdmin
      .from("jadwal")
      .select("id, guru_id, kelas_id, mata_pelajaran, hari, jam_mulai, jam_selesai, guru(nama), kelas(nama_kelas)")
      .eq("status", "aktif"),
    supabaseAdmin.from("hari_libur").select("tanggal"),
    supabaseAdmin.from("pengaturan_sistem").select("jam_cutoff, libur_panjang_aktif, libur_panjang_mulai, libur_panjang_selesai").maybeSingle(),
    supabaseAdmin
      .from("absensi_mengajar")
      .select("tanggal")
      .neq("status", "tidak_mengajar")
      .order("tanggal", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from("guru").select("id, created_at").eq("status", "aktif"),
  ]);

  if (absensiRes.error) throw new Error(absensiRes.error.message);
  if (jadwalRes.error) throw new Error(jadwalRes.error.message);

  // Guard 2: Cek apakah sudah pernah ada aktivitas mengajar riil di sekolah
  const earliestMengajarDate = earliestMengajarRes.data?.tanggal
    ? (typeof earliestMengajarRes.data.tanggal === "string" ? earliestMengajarRes.data.tanggal.slice(0, 10) : "")
    : null;

  if (!earliestMengajarDate) {
    try {
      await supabaseAdmin.from("absensi_mengajar").delete().eq("status", "tidak_mengajar");
    } catch (e) {
      console.error("Gagal membersihkan data tidak mengajar prematur:", e);
    }
    return [];
  }

  const guruCreatedMap = new Map<string, string>();
  for (const g of (guruRes.data ?? [])) {
    if ((g as any).created_at) {
      guruCreatedMap.set(g.id, toDateStrWIB((g as any).created_at));
    }
  }

  // Filter dan bersihkan rekaman tidak_mengajar prematur (tanggal < earliestMengajarDate ATAU tanggal < guru.created_at)
  const invalidTidakMengajarIds: string[] = [];
  const validAbsensiRows = ((absensiRes.data ?? []) as any[]).filter((row: any) => {
    if (row.status === "tidak_mengajar") {
      const tStr = typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "";
      const jadwal = Array.isArray(row.jadwal) ? row.jadwal[0] : row.jadwal;
      const guruId = jadwal?.guru_id;
      const gCreated = guruId ? guruCreatedMap.get(guruId) : undefined;
      if (tStr < earliestMengajarDate || (gCreated && tStr < gCreated)) {
        invalidTidakMengajarIds.push(row.id);
        return false;
      }
    }
    return true;
  });

  if (invalidTidakMengajarIds.length > 0) {
    try {
      await supabaseAdmin.from("absensi_mengajar").delete().in("id", invalidTidakMengajarIds);
    } catch (err) {
      console.error("Gagal menghapus rekaman tidak mengajar prematur:", err);
    }
  }

  const realRecords: LaporanMengajar[] = validAbsensiRows.map((row: any) => {
    const jadwal = Array.isArray(row.jadwal) ? row.jadwal[0] : row.jadwal;
    const guru = Array.isArray(jadwal?.guru) ? jadwal?.guru[0] : jadwal?.guru;
    const kelas = Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0] : jadwal?.kelas;
    const statusDb = row.status === "tidak_mengajar" ? "Tidak Mengajar" : "Mengajar";
    const waktuAbsen = (row.status === "tidak_mengajar" || !row.waktu_submit)
      ? "—"
      : new Date(row.waktu_submit).toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).replace(".", ":");

    return {
      id: row.id,
      guru_id: jadwal?.guru_id ?? "",
      kelas_id: jadwal?.kelas_id ?? "",
      jadwal_id: row.jadwal_id || jadwal?.id || "",
      tanggal: new Date(row.tanggal).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      raw_tanggal: typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "",
      nama: guru?.nama ?? "-",
      kelas: kelas?.nama_kelas ?? "-",
      mata_pelajaran: jadwal?.mata_pelajaran ?? "-",
      waktu: jadwal ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)}` : "-",
      waktu_submit: row.waktu_submit || null,
      waktu_absen: waktuAbsen,
      status: statusDb,
      foto_absensi: row.foto_absensi
    };
  });

  // Rekonsiliasi jadwal mengajar vs absensi mengajar jika startDate & endDate terdefinisi
  if (startDate && endDate) {
    const todayWIB = getTodayWIB();
    const nowJamWIB = getJamWIB();
    const holidaySet = new Set<string>(
      (hariLiburRes.data ?? []).map((h: any) => (typeof h.tanggal === "string" ? h.tanggal.slice(0, 10) : ""))
    );
    const lp = pengaturanRes.data;
    const isDateInLiburPanjang = (dateStr: string) => {
      if (!lp?.libur_panjang_aktif || !lp?.libur_panjang_mulai || !lp?.libur_panjang_selesai) return false;
      return dateStr >= lp.libur_panjang_mulai && dateStr <= lp.libur_panjang_selesai;
    };

    // Set presensi yang sudah tercatat: key = `${jadwal_id}_${tanggal}`
    const existingSet = new Set<string>();
    for (const row of validAbsensiRows) {
      const tStr = typeof row.tanggal === "string" ? row.tanggal.slice(0, 10) : "";
      const jId = row.jadwal_id || (Array.isArray(row.jadwal) ? row.jadwal[0]?.id : row.jadwal?.id);
      if (jId && tStr) {
        existingSet.add(`${jId}_${tStr}`);
      }
    }

    // Bangun deretan tanggal dalam rentang periode
    const dates: string[] = [];
    const [sY, sM, sD] = startDate.split("-").map(Number);
    const [eY, eM, eD] = endDate.split("-").map(Number);
    const cur = new Date(Date.UTC(sY, sM - 1, sD, 12, 0, 0));
    const end = new Date(Date.UTC(eY, eM - 1, eD, 12, 0, 0));

    while (cur <= end) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
      const d = String(cur.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const missingRows: LaporanMengajar[] = [];
    const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    const allJadwal = jadwalRes.data ?? [];

    for (const dateStr of dates) {
      // 1. Lewati tanggal sebelum fitur Tidak Mengajar resmi berlaku
      if (dateStr < TANGGAL_MULAI_TIDAK_MENGAJAR) continue;

      // 1b. Lewati tanggal sebelum aktivitas mengajar perdana di sekolah
      if (dateStr < earliestMengajarDate) continue;

      // 2. Lewati akhir pekan
      if (isWeekendWIB(dateStr)) continue;

      // 3. Lewati hari libur nasional atau libur panjang
      if (holidaySet.has(dateStr) || isDateInLiburPanjang(dateStr)) continue;

      // 4. Lewati tanggal di masa depan
      if (dateStr > todayWIB) continue;

      // Nama hari dalam WIB
      const [yr, mo, da] = dateStr.split("-").map(Number);
      const dObj = new Date(Date.UTC(yr, mo - 1, da, 5, 0, 0));
      const dayOfWeek = dayNames[dObj.getUTCDay()];

      // Filter jadwal yang terjadwal pada hari tersebut
      const jadwalHariIni = allJadwal.filter((j: any) => j.hari === dayOfWeek);

      for (const j of jadwalHariIni as any[]) {
        // Guard 1: Lewati jika guru belum terdaftar pada tanggal ini
        const guruCreatedDateStr = guruCreatedMap.get(j.guru_id);
        if (guruCreatedDateStr && dateStr < guruCreatedDateStr) {
          continue;
        }

        // Jika tanggal adalah hari ini, lewati jika jam_selesai jadwal belum berlalu
        if (dateStr === todayWIB) {
          const jamSelesaiFormatted = String(j.jam_selesai || "16:00:00").slice(0, 8);
          if (nowJamWIB < jamSelesaiFormatted) continue;
        }

        const key = `${j.id}_${dateStr}`;
        if (!existingSet.has(key)) {
          const guru = Array.isArray(j.guru) ? j.guru[0] : j.guru;
          const kelas = Array.isArray(j.kelas) ? j.kelas[0] : j.kelas;

          missingRows.push({
            id: `unrecorded-mengajar-${j.id}-${dateStr}`,
            guru_id: j.guru_id,
            kelas_id: j.kelas_id,
            jadwal_id: j.id,
            tanggal: dObj.toLocaleDateString("id-ID", {
              timeZone: "Asia/Jakarta",
              day: "2-digit",
              month: "short",
              year: "numeric"
            }),
            raw_tanggal: dateStr,
            nama: guru?.nama ?? "-",
            kelas: kelas?.nama_kelas ?? "-",
            mata_pelajaran: j.mata_pelajaran ?? "-",
            waktu: `${String(j.jam_mulai).slice(0, 5)} - ${String(j.jam_selesai).slice(0, 5)}`,
            waktu_submit: null,
            waktu_absen: "—",
            status: "Tidak Mengajar",
            foto_absensi: null
          });
          existingSet.add(key);
        }
      }
    }

    // Persistensikan rekaman tidak mengajar yang hilang ke database
    if (missingRows.length > 0) {
      try {
        const recordsToUpsert = missingRows.map((m) => {
          const endTime = m.waktu.includes(" - ") ? m.waktu.split(" - ")[1] : "16:00";
          return {
            jadwal_id: m.id.replace("unrecorded-mengajar-", "").split("-")[0],
            tanggal: m.raw_tanggal,
            status: "tidak_mengajar",
            foto_absensi: null,
            waktu_submit: `${m.raw_tanggal}T${endTime}:00+07:00`,
          };
        });

        await supabaseAdmin
          .from("absensi_mengajar")
          .upsert(recordsToUpsert, { onConflict: "jadwal_id, tanggal", ignoreDuplicates: true });

        // Ambil data resmi yang kini telah memiliki ID database
        const jadwalIdsToFetch = Array.from(new Set(recordsToUpsert.map((r) => r.jadwal_id)));
        const datesToFetch = Array.from(new Set(recordsToUpsert.map((r) => r.tanggal)));
        const { data: dbMissing } = await supabaseAdmin
          .from("absensi_mengajar")
          .select("id, jadwal_id, tanggal, waktu_submit, status, foto_absensi, jadwal(id, mata_pelajaran, jam_mulai, jam_selesai, guru_id, kelas_id, guru(nama), kelas(nama_kelas))")
          .in("jadwal_id", jadwalIdsToFetch)
          .in("tanggal", datesToFetch)
          .eq("status", "tidak_mengajar");

        if (dbMissing && dbMissing.length > 0) {
          const dbMissingMapped: LaporanMengajar[] = (dbMissing as any[]).map((row) => {
            const jadwal = Array.isArray(row.jadwal) ? row.jadwal[0] : row.jadwal;
            const guru = Array.isArray(jadwal?.guru) ? jadwal?.guru[0] : jadwal?.guru;
            const kelas = Array.isArray(jadwal?.kelas) ? jadwal?.kelas[0] : jadwal?.kelas;
            const [yr, mo, da] = String(row.tanggal).slice(0, 10).split("-").map(Number);
            const dObj = new Date(Date.UTC(yr, mo - 1, da, 12, 0, 0));

            return {
              id: row.id,
              guru_id: jadwal?.guru_id ?? "",
              kelas_id: jadwal?.kelas_id ?? "",
              jadwal_id: row.jadwal_id || jadwal?.id || "",
              tanggal: dObj.toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "2-digit",
                month: "short",
                year: "numeric"
              }),
              raw_tanggal: String(row.tanggal).slice(0, 10),
              nama: guru?.nama ?? "-",
              kelas: kelas?.nama_kelas ?? "-",
              mata_pelajaran: jadwal?.mata_pelajaran ?? "-",
              waktu: jadwal ? `${jadwal.jam_mulai.slice(0, 5)} - ${jadwal.jam_selesai.slice(0, 5)}` : "-",
              waktu_submit: row.waktu_submit || null,
              waktu_absen: "—",
              status: "Tidak Mengajar",
              foto_absensi: null
            };
          });

          missingRows.length = 0;
          missingRows.push(...dbMissingMapped);
        }
      } catch (err) {
        console.error("Gagal melakukan batch upsert tidak_mengajar ke database:", err);
      }
    }

    const combined = [...realRecords, ...missingRows];
    combined.sort((a, b) => {
      const dateA = a.raw_tanggal || "";
      const dateB = b.raw_tanggal || "";
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return a.nama.localeCompare(b.nama);
    });

    return combined;
  }

  return realRecords;
}

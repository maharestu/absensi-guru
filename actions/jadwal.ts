"use server";

/**
 * SERVER ACTIONS — JADWAL
 * Fetch and manage jadwal mengajar dari Supabase.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { Jadwal, JadwalWithDetail } from "@/types/schema";

export async function getJadwalList(): Promise<JadwalWithDetail[]> {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `)
    .order("hari")
    .order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal list:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function getJadwalById(id: string): Promise<JadwalWithDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching jadwal by id:", error);
    return null;
  }

  return (data as unknown as JadwalWithDetail) ?? null;
}

export async function getJadwalByGuruAndHari(
  guruId?: string,
  kelasId?: string,
  hari?: string
): Promise<JadwalWithDetail[]> {
  const VALID_HARI = ["senin", "selasa", "rabu", "kamis", "jumat"];

  if (hari) {
    const normalizedHari = hari.toLowerCase();
    if (!VALID_HARI.includes(normalizedHari)) {
      return [];
    }
  }

  let query = supabaseAdmin
    .from("jadwal")
    .select(`
      *,
      guru:guru_id ( id, nama, nip ),
      kelas:kelas_id ( id, nama_kelas )
    `);

  if (guruId) query = query.eq("guru_id", guruId);
  if (kelasId) query = query.eq("kelas_id", kelasId);
  if (hari) query = query.eq("hari", hari.toLowerCase());

  const { data, error } = await query.order("jam_mulai");

  if (error) {
    console.error("Error fetching jadwal:", error);
    throw new Error(error.message);
  }

  return (data as unknown as JadwalWithDetail[]) ?? [];
}

export async function createJadwal(input: Omit<Jadwal, "id" | "created_at">) {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateJadwal(id: string, input: Partial<Jadwal>) {
  const { data, error } = await supabaseAdmin
    .from("jadwal")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteJadwal(id: string) {
  const { error } = await supabaseAdmin
    .from("jadwal")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export type SmartJadwalPayload = {
  gurus: { kode: number; nama: string }[];
  mapels: { kode: string; nama: string }[];
  kelas: { nama_kelas: string }[];
  jadwals: {
    hari: string;
    kelasName: string;
    jamMulai: string;
    jamSelesai: string;
    guruKode: number;
    mapelKode: string;
  }[];
};

export async function importSmartJadwal(payload: SmartJadwalPayload): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    // 1. Process Guru
    const { data: existingGurus } = await supabaseAdmin.from("guru").select("id, nama");
    const guruMap = new Map<number, string>(); // kode -> uuid
    
    for (const g of payload.gurus) {
      const existing = existingGurus?.find(e => e.nama.toLowerCase() === g.nama.toLowerCase());
      
      let guruId = "";
      if (existing) {
        guruId = existing.id;
        guruMap.set(g.kode, guruId);
        
        // Update jabatan untuk guru lama yang belum punya jabatan
        await supabaseAdmin.from("guru").update({ jabatan: "Guru" }).eq("id", guruId);
      } else {
        const nip = `TEMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { data, error } = await supabaseAdmin.from("guru").insert({
          nama: g.nama,
          nip,
          jabatan: "Guru",
          status: "aktif"
        }).select("id").single();
        if (!error && data) {
          guruId = data.id;
          guruMap.set(g.kode, guruId);
        }
      }

      // Pastikan akun selalu terbuat jika belum ada
      if (guruId) {
        const { data: existingAkun } = await supabaseAdmin.from("akun").select("id").eq("guru_id", guruId).single();
        if (!existingAkun) {
          const { createAkun } = await import("./akun");
          const baseName = g.nama.split(",")[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
          const username = `${baseName}${g.kode}`;
          await createAkun({
             username,
             password: "password123",
             nama: g.nama,
             role: "guru",
             guru_id: guruId
          });
        }
      }
    }

    // 2. Process Kelas
    const { data: existingKelas } = await supabaseAdmin.from("kelas").select("id, nama_kelas");
    const kelasMap = new Map<string, string>(); // nama_kelas -> uuid
    
    for (const k of payload.kelas) {
      const existing = existingKelas?.find(e => e.nama_kelas.toLowerCase() === k.nama_kelas.toLowerCase());
      if (existing) {
        kelasMap.set(k.nama_kelas, existing.id);
      } else {
        const kode_qr = `QR-${Date.now()}-${k.nama_kelas.replace(/\s/g, '')}`;
        const { data, error } = await supabaseAdmin.from("kelas").insert({
          nama_kelas: k.nama_kelas,
          kode_qr
        }).select("id").single();
        if (!error && data) {
          kelasMap.set(k.nama_kelas, data.id);
        }
      }
    }

    // 3. Map Mapels
    const mapelMap = new Map<string, string>();
    for (const m of payload.mapels) {
      mapelMap.set(m.kode, m.nama);
    }

    // 4. Build Jadwal Payload
    const jadwalInserts = [];
    for (const j of payload.jadwals) {
      const guruId = guruMap.get(j.guruKode);
      const kelasId = kelasMap.get(j.kelasName);
      const mapelName = mapelMap.get(j.mapelKode) || `Mapel ${j.mapelKode}`;

      // Convert format "07.30" or "0850" to "07:30:00"
      const formatTime = (t: string) => {
        const digits = t.replace(/\D/g, ''); // Extract only numbers
        if (digits.length === 3) {
           return `0${digits[0]}:${digits.slice(1, 3)}:00`;
        }
        if (digits.length === 4) {
           return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:00`;
        }
        return "00:00:00"; // fallback
      };

      if (guruId && kelasId) {
        jadwalInserts.push({
          guru_id: guruId,
          kelas_id: kelasId,
          mata_pelajaran: mapelName,
          hari: j.hari.toLowerCase(),
          jam_mulai: formatTime(j.jamMulai),
          jam_selesai: formatTime(j.jamSelesai),
          status: "aktif"
        });
      }
    }

    // Insert all jadwals
    if (jadwalInserts.length > 0) {
      const { error } = await supabaseAdmin.from("jadwal").insert(jadwalInserts);
      if (error) return { success: false, error: error.message };
    }

    return { success: true, count: jadwalInserts.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

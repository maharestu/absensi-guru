"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function parseJadwalWithAI(csvData: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY belum diatur di file .env.local");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Menggunakan gemini-3.8-flash untuk kompatibilitas versi API terbaru
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.8-flash",
      generationConfig: {
        responseMimeType: "application/json", 
        // Memaksa AI mengembalikan JSON array ringkas
        responseSchema: {
          type: SchemaType.ARRAY,
          description: "Daftar jadwal",
          items: {
            type: SchemaType.ARRAY,
            description: "Format mutlak: [guruKode, mapelKode, kelasNama, hari, jamMulai, jamSelesai]",
            items: {
              type: SchemaType.STRING
            }
          }
        }
      }
    });

    const prompt = `
Anda adalah sistem cerdas pengekstrak jadwal sekolah.
Berikut adalah data tabel jadwal (dalam format CSV):
---
${csvData}
---

Instruksi Parsing:
1. Temukan nama-nama kelas yang menjadi judul kolom (biasanya seperti 7A, 7B, 8A).
2. Temukan kolom hari (Senin, Selasa, dst) dan rentang jam (misalnya 07.00-08.20 atau 07:00-08:20). Ubah format jam menjadi HH:MM:SS.
3. WAJIB ubah nama hari menjadi huruf kecil semua dan tanpa tanda baca (Gunakan persis salah satu dari ini: "senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"). JANGAN gunakan "jum'at".
4. Di dalam sel jadwal, terdapat data berupa gabungan Angka dan Huruf tanpa spasi (misal: "15A"). Ini berarti guruKode="15" dan mapelKode="A".
5. Abaikan sel yang kosong, berisi teks seperti "ISTIRAHAT", "UPACARA", "LIBUR", atau "-".
6. Jika ada pelajaran yang sama secara berurutan pada kelas yang sama, satukan rentang jam mulai dan selesainya menjadi satu blok durasi.

Format Output WAJIB berupa Array of Arrays. Tiap baris berisi urutan persis:
["guruKode", "mapelKode", "kelasNama", "hari", "jamMulai", "jamSelesai"]
Contoh Output:
[["15", "A", "7A", "senin", "07:00:00", "08:20:00"], ["15", "A", "7B", "senin", "08:20:00", "09:40:00"]]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedRaw = JSON.parse(responseText);
    
    // Kembalikan ke format Object yang dikenali oleh sistem aplikasi Anda
    const mappedJSON = parsedRaw.map((item: string[]) => ({
      guruKode: item[0],
      mapelKode: item[1],
      kelasNama: item[2],
      hari: item[3],
      jamMulai: item[4],
      jamSelesai: item[5]
    }));
    
    return { success: true, data: mappedJSON };
  } catch (error: any) {
    console.error("AI Error:", error);
    return { success: false, error: error.message || "Gagal memproses AI" };
  }
}

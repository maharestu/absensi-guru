"use server";

import fs from "fs";
import path from "path";

let cachedLogoBase64: string | null = null;

/**
 * Mengambil file Logo.png dari folder public dan mengonversinya ke Base64 data URL.
 * Hasilnya dicache di memori server agar tidak membaca disk berulang kali.
 */
export async function getLogoBase64(): Promise<string> {
  if (cachedLogoBase64) {
    return cachedLogoBase64;
  }

  try {
    const filePath = path.join(process.cwd(), "public", "Logo.png");
    const fileBuffer = await fs.promises.readFile(filePath);
    cachedLogoBase64 = `data:image/png;base64,${fileBuffer.toString("base64")}`;
    return cachedLogoBase64;
  } catch (error) {
    console.error("Gagal membaca Logo.png pada server:", error);
    return "";
  }
}

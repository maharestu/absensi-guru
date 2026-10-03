import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iygwlawcgcegzacnjkor.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Membuat bucket foto-absensi...");
  const { data, error } = await db.storage.createBucket("foto-absensi", {
    public: true,
    allowedMimeTypes: ["image/webp"],
    fileSizeLimit: 5242880, // 5MB
  });

  if (error) {
    if (error.message.includes("already exists") || error.message.includes("duplicate key")) {
        console.log("Bucket sudah ada.");
    } else {
        console.error("Error membuat bucket:", error.message);
    }
  } else {
    console.log("Bucket berhasil dibuat:", data);
  }
}

main().catch(console.error);

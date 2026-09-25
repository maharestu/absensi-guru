import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "Supabase URL or Publishable Key is missing in environment variables."
  );
}

// Client untuk frontend (publishable key) — aman dipakai di browser
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Client untuk server-side / admin operations (service role key)
// 🔒 Hanya gunakan di Server Actions ("use server") dan script Node.js
// JANGAN dipakai di komponen client / browser
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

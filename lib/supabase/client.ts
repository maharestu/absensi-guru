/**
 * SUPABASE CLIENT — Browser / Client Components
 *
 * Digunakan untuk inisialisasi Supabase Client pada komponen Client Side React.
 * Menggunakan Publishable Key (aman di browser, tunduk pada Row Level Security).
 */

import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

/**
 * SUPABASE ADMIN CLIENT — Server Actions / Route Handlers
 *
 * Digunakan untuk operasi server-side yang membutuhkan akses penuh ke database
 * (bypass Row Level Security). Menggunakan Service Role Key.
 *
 * ⚠️  JANGAN import file ini di komponen client / "use client"
 */

import { createClient } from "@supabase/supabase-js";

export function createServerAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * DATABASE TYPES (Placeholder)
 * 
 * Tipe data otomatis yang digenerate dari skema PostgreSQL Supabase.
 * 
 * Referensi: https://github.com/naenmad/absensi-guru/blob/main/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Placeholder untuk skema Supabase PostgreSQL
    }
  }
}

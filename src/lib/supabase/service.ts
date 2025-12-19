import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client dengan SERVICE ROLE
 * ------------------------------------------------
 * Digunakan KHUSUS untuk:
 * - tambah / edit / hapus STRUCTURE
 *   (feature_sections, feature_fields)
 * - hanya saat Super Admin Mode aktif
 *
 * ⚠️ Jangan dipakai di client component
 * ⚠️ Jangan dipakai untuk operasi user biasa
 */
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error(
      "Supabase service role env belum diset (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

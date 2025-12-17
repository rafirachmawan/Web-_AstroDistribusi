// _shared.ts
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export function admin() {
  // service role: bypass RLS
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// flag superadmin dari cookie sederhana (sesuai implementasimu)
export async function isSuperAdmin() {
  const c = await cookies();
  return c.get("sa")?.value === "1"; // '1' di-set saat enable super-admin
}

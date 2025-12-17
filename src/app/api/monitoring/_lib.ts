import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function isSuperAdmin() {
  const c = await cookies();
  return c.get("sa")?.value === "1";
}

export function supaAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role
    { auth: { persistSession: false } }
  );
}

export function supaAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

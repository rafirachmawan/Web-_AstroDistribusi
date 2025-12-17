import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

// Role yang boleh "override role" via query (super/IT/direktur/HRD)
export const ELEVATED = new Set(["it", "direktur", "hrd"]);

/**
 * Ambil role user login. Jangan biarkan error refresh token bikin throw.
 * Selalu pulang { roleKey, supabase } meskipun roleKey = null (belum login).
 */
export async function getMyRoleKey() {
  const supabase = await getServerSupabase();

  let uid: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    uid = data.session?.user?.id ?? null;
  } catch {
    // abaikan error refresh_token_not_found
  }
  if (!uid) {
    try {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? null;
    } catch {}
  }
  if (!uid) return { roleKey: null as string | null, supabase };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("user_id", uid)
    .maybeSingle();

  return { roleKey: prof?.role_key ?? null, supabase };
}

/** Cek cookie super_admin=1 (di Route Handler Next 15 → cookies() harus diawait) */
export async function isSuperAdmin() {
  try {
    const store = await cookies(); // <— WAJIB pakai await (Next 15)
    return store.get("super_admin")?.value === "1";
  } catch {
    return false;
  }
}

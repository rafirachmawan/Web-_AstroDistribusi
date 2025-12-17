import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";

export type ProfileRow = {
  user_id: string;
  full_name: string | null;
  // kalau skema kamu pakai role_key, gunakan role_key di sini
  role_key?: string | null;
  role?: "admin" | "leader" | "salesman" | "warehouse" | "hr" | "ops"; // biar kompatibel dgn versi lama
  module_access?: string[] | null;
  warehouse_ids?: string[] | null;
};

export async function getSessionAndProfile(): Promise<{
  session:
    | Awaited<
        ReturnType<
          Awaited<ReturnType<typeof getServerSupabase>>["auth"]["getSession"]
        >
      >["data"]["session"]
    | null;
  profile: ProfileRow | null;
}> {
  const sb = await getServerSupabase();

  // ambil session (ini juga memicu refresh token bila perlu)
  const {
    data: { session },
    error: sErr,
  } = await sb.auth.getSession();
  if (sErr) throw sErr;
  if (!session?.user) return { session: null, profile: null };

  const uid = session.user.id;

  // 1) Coba RPC jika memang ada (biar kompatibel dgn set-up lama)
  let rpcData: any = null;
  let rpcErr: any = null;
  try {
    const { data, error } = await sb.rpc("get_my_profile").maybeSingle();
    rpcData = data ?? null;
    rpcErr = error ?? null;
  } catch (_) {
    rpcErr = _;
  }
  if (rpcData && !rpcErr) {
    return { session, profile: rpcData as ProfileRow };
  }

  // 2) Fallback: langsung select dari tabel profiles
  const { data: sel, error: selErr } = await sb
    .from("profiles")
    .select("user_id, full_name, role_key, role, module_access, warehouse_ids")
    .eq("user_id", uid)
    .maybeSingle();

  if (selErr && selErr.code !== "PGRST116") {
    // PGRST116 = no rows
    throw selErr;
  }

  return { session, profile: (sel as ProfileRow) ?? null };
}

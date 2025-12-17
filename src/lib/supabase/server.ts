import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function getServerSupabase() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...(options ?? {}) });
          } catch {}
        },
        remove(name: string, options?: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...(options ?? {}), maxAge: 0 });
          } catch {}
        },
      },
    }
  );

  // ---- PATCH anti "refresh token not found" di server ----
  const _getSession = supabase.auth.getSession.bind(supabase.auth);
  supabase.auth.getSession = async () => {
    try {
      return await _getSession();
    } catch {
      return { data: { session: null }, error: null } as any;
    }
  };

  const _getUser = supabase.auth.getUser.bind(supabase.auth);
  supabase.auth.getUser = async () => {
    try {
      return await _getUser();
    } catch {
      return { data: { user: null }, error: null } as any;
    }
  };
  // --------------------------------------------------------

  return supabase;
}

export function getServiceSupabase() {
  const supabaseSrv = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return supabaseSrv;
}

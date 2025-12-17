import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

async function isSuper() {
  try {
    const jar = await cookies();
    return jar.get("super_admin")?.value === "1";
  } catch {
    return false;
  }
}

async function getProfileRoleKey(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role_key, role, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (prof?.role_key as string) ?? (prof?.role as string) ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qRole = url.searchParams.get("role") || "";

  const supabase = await getServerSupabase();
  const superMode = await isSuper();
  const profileRole = await getProfileRoleKey(supabase);
  const role = superMode ? qRole || profileRole : profileRole;

  if (!role) return NextResponse.json({ role: null, members: [] });

  const { data: members } = await supabase
    .from("role_members")
    .select("id, name, idx, is_active")
    .eq("role_key", role)
    .order("idx");

  return NextResponse.json({ role, members: members ?? [] });
}

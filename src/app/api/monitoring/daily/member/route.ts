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

  const { data: members, error } = await supabase
    .from("role_members")
    .select("id, name, idx, is_active")
    .eq("role_key", role)
    .order("idx");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ role, members: members ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const role_key = String(body?.role_key || "").trim();
  if (!name || !role_key) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await getServerSupabase();

  // tentukan idx berikutnya
  const { data: last } = await supabase
    .from("role_members")
    .select("idx")
    .eq("role_key", role_key)
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextIdx = (last?.idx ?? 0) + 1;

  const { data, error } = await supabase
    .from("role_members")
    .insert({ role_key, name, idx: nextIdx, is_active: true })
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data?.id, ok: true });
}

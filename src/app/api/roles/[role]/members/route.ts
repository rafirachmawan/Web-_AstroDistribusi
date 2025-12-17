import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { role: string } }
) {
  const sb = await getServerSupabase();
  const { data, error } = await sb
    .from("role_members")
    .select("id, name, idx, is_active")
    .eq("role_key", params.role)
    .order("is_active", { ascending: false })
    .order("idx", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}
export async function POST(
  req: Request,
  { params }: { params: { role: string } }
) {
  const sb = await getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const idx = Number(body?.idx ?? 0);

  if (!name) return NextResponse.json({ error: "Nama wajib" }, { status: 400 });

  const { data, error } = await sb
    .from("role_members")
    .insert([{ role_key: params.role, name, idx }])
    .select("id, role_key, name, idx, is_active")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}

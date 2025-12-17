import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { role: string; id: string } }
) {
  const sb = await getServerSupabase();
  const body = await req.json().catch(() => ({}));
  const payload: Record<string, any> = {};

  if (typeof body.name === "string") payload.name = body.name.trim();
  if (Number.isFinite(body.idx)) payload.idx = Number(body.idx);
  if (typeof body.is_active === "boolean") payload.is_active = body.is_active;

  if (Object.keys(payload).length === 0)
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });

  const { data, error } = await sb
    .from("role_members")
    .update(payload)
    .eq("id", params.id)
    .eq("role_key", params.role)
    .select("id, role_key, name, idx, is_active")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { role: string; id: string } }
) {
  const sb = await getServerSupabase();
  const { error } = await sb
    .from("role_members")
    .delete()
    .eq("id", params.id)
    .eq("role_key", params.role);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

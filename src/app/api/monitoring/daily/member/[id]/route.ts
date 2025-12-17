import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  if (!id || !name) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("role_members")
    .update({ name })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await getServerSupabase();
  const { error } = await supabase.from("role_members").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

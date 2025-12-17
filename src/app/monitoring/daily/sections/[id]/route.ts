import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isSuperAdmin() {
  const c = await cookies();
  return c.get("sa")?.value === "1";
}
function ensureEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !srv) throw new Error("Supabase env missing");
  return { url, srv };
}
function admin() {
  const { url, srv } = ensureEnv();
  return createClient(url, srv, { auth: { persistSession: false } });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = ctx.params.id;
    const body = await req.json().catch(() => ({}));
    const patch: any = {};
    if (typeof body.title === "string") patch.title = String(body.title).trim();
    if (Number.isFinite(body.idx)) patch.idx = Number(body.idx);

    const sb = admin();
    const { data, error } = await sb
      .from("feature_sections")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ section: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = ctx.params.id;
    const sb = admin();
    const { error } = await sb.from("feature_sections").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

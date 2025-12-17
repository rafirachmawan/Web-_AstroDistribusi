import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isSuperAdmin() {
  const c = await cookies();
  return c.get("sa")?.value === "1";
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET — filter per feature (default "checklist")
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const feature = url.searchParams.get("feature") ?? "checklist";
    const sb = anon();

    const { data, error } = await sb
      .from("feature_sections")
      .select("*")
      .eq("feature_key", feature)
      .order("idx", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ sections: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — pakai service-role & tulis feature_key
export async function POST(req: Request) {
  try {
    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = new URL(req.url);
    const feature = url.searchParams.get("feature") ?? "checklist";

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    if (!title)
      return NextResponse.json({ error: "Title wajib" }, { status: 400 });

    const sb = admin();

    const { data: last, error: e1 } = await sb
      .from("feature_sections")
      .select("idx")
      .eq("feature_key", feature)
      .order("idx", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (e1) throw e1;

    const nextIdx = (last?.idx ?? 0) + 1;

    const { data, error } = await sb
      .from("feature_sections")
      .insert({ feature_key: feature, title, idx: nextIdx })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ section: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

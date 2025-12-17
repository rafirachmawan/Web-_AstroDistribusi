import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST() {
  try {
    const feature = "checklist"; // sesuaikan jika perlu
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
      .insert({ feature_key: feature, title: "DEBUG SRV INSERT", idx: nextIdx })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, section: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

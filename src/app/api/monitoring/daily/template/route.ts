import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const supa = admin();

  const { data: secs, error: e1 } = await supa
    .from("ml_sections")
    .select("id,title,position")
    .order("position", { ascending: true });

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: flds, error: e2 } = await supa
    .from("ml_fields")
    .select("id,section_id,label,type,options,idx")
    .order("idx", { ascending: true });

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const bySec = new Map<string, any[]>();
  for (const s of secs ?? []) bySec.set(s.id, []);
  for (const f of flds ?? []) {
    const arr = bySec.get(f.section_id);
    if (arr) arr.push(f);
  }

  const sections = (secs ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    idx: s.position,
    fields: (bySec.get(s.id) ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      options: f.options ?? [],
      section_id: f.section_id,
      idx: f.idx,
    })),
  }));

  return NextResponse.json({ sections });
}

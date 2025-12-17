import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Auth pakai supabase server (RLS user)
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Ambil payload
  const body = await req.json().catch(() => ({}));
  const {
    section_id,
    type,
    label,
    options,
    // suffix  ← TIDAK dipakai (kolomnya memang tidak ada)
    placeholder,
    group_key,
    group_label,
    group_order,
  } = body || {};

  if (!section_id || !type || !label) {
    return NextResponse.json(
      { error: "section_id, type, label wajib" },
      { status: 400 }
    );
  }

  // Siapkan nilai options (hanya jika tipe butuh pilihan)
  const opts =
    Array.isArray(options) && ["radio", "checkbox", "select"].includes(type)
      ? options
      : null;

  // Tentukan idx berikutnya di dalam section
  const { data: last } = await sb
    .from("feature_fields")
    .select("idx")
    .eq("section_id", section_id)
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextIdx = ((last?.idx as number | undefined) ?? -1) + 1;

  // INSERT ke kolom yang memang ada di tabel
  const { data, error } = await sb
    .from("feature_fields")
    .insert({
      section_id,
      type,
      label,
      options: opts, // array atau null
      placeholder: placeholder ?? null,
      group_key: group_key ?? null,
      group_label: group_label ?? null,
      group_order: group_order ?? null,
      idx: nextIdx,
    })
    .select(
      "id, section_id, type, label, help, idx, options, min, max, placeholder, group_key, group_label, group_order"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ field: data }, { status: 201 });
}

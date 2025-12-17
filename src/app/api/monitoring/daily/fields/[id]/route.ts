import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  // --- siapkan kolom top-level yang boleh diupdate
  const updates: Record<string, any> = {};

  if (body.label != null) updates.label = String(body.label);
  if (body.type != null) updates.type = String(body.type);

  // ⬇️ inilah yang hilang tadi: dukung perubahan urutan
  if (body.idx != null && Number.isFinite(Number(body.idx))) {
    updates.idx = Number(body.idx);
  }

  // --- handle options: merge ringan agar tidak menghapus field lain tak sengaja
  const opt: Record<string, any> = {};

  // izinkan kirim options apa pun; kalau mau batasi, bisa cek tipe
  if (Array.isArray(body.options)) {
    opt.options = body.options;
  }
  if (body.suffix != null) opt.suffix = body.suffix;
  if (body.placeholder != null) opt.placeholder = body.placeholder;
  if (body.group_key != null) opt.group_key = body.group_key;
  if (body.group_label != null) opt.group_label = body.group_label;
  if (body.group_order != null) opt.group_order = body.group_order;

  if (Object.keys(opt).length) {
    // Kalau kamu ingin benar-benar merge dengan existing options di DB, uncomment blok berikut:
    // const { data: existing } = await sb
    //   .from("feature_fields")
    //   .select("options")
    //   .eq("id", params.id)
    //   .single();
    // const merged = { ...(existing?.options ?? {}), ...opt };
    // updates.options = merged;

    updates.options = opt; // default: timpa options sekaligus
  }

  const { error } = await sb
    .from("feature_fields")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { error } = await sb
    .from("feature_fields")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

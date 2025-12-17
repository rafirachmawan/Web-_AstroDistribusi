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

// CREATE field
export async function POST(req: Request) {
  if (!(await isSuper()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      section_id,
      label,
      type = "radio",
      idx,
      options = null,
      required = false,
      help = null,
      suffix = null,
      placeholder = null,
      min = null,
      max = null,
      group_key = null,
      group_label = null,
      group_order = null,
    } = body || {};

    if (!section_id || !label) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await getServerSupabase();

    // cari idx terakhir jika tidak dikirim
    let finalIdx = idx;
    if (finalIdx == null) {
      const { data: last } = await supabase
        .from("feature_fields")
        .select("idx")
        .eq("section_id", section_id)
        .order("idx", { ascending: false })
        .limit(1)
        .maybeSingle();
      finalIdx = (last?.idx ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("feature_fields")
      .insert({
        section_id,
        label,
        type,
        idx: finalIdx,
        options,
        required,
        help,
        suffix,
        placeholder,
        min,
        max,
        group_key,
        group_label,
        group_order,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ field: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

// UPDATE field
export async function PATCH(req: Request) {
  if (!(await isSuper()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();

    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("feature_fields")
      .update(body)
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

// DELETE field
export async function DELETE(req: Request) {
  if (!(await isSuper()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("feature_fields")
      .delete()
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

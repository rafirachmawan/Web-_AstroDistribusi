import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "../../../../../../../lib/supabase/server";

async function isSuper() {
  const jar = await cookies();
  return jar.get("super_admin")?.value === "1";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isSuper())) {
    return NextResponse.json(
      { error: "Forbidden (super admin off)" },
      { status: 403 }
    );
  }

  const supabase = await getServerSupabase();

  // pastikan ada user (biar RLS tidak nolak)
  const { data: sess, error: authErr } = await supabase.auth.getUser();
  if (authErr || !sess?.user) {
    return NextResponse.json(
      { error: "Session Supabase kosong. Login ulang." },
      { status: 401 }
    );
  }

  const sectionId = params.id;
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  let type = String(body?.type ?? "")
    .toLowerCase()
    .trim();
  const label = String(body?.label ?? "").trim();

  let options: string[] = [];
  if (Array.isArray(body?.options)) {
    options = body.options
      .map((x: any) => String(x ?? "").trim())
      .filter(Boolean);
  } else if (typeof body?.options === "string") {
    options = body.options
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  if (!sectionId || !type || !label) {
    return NextResponse.json(
      { error: "sectionId/type/label wajib" },
      { status: 400 }
    );
  }
  if (!["radio", "number", "text", "currency"].includes(type)) {
    return NextResponse.json(
      { error: `Tipe tidak valid: ${type}` },
      { status: 400 }
    );
  }

  const { data: last, error: eIdx } = await supabase
    .from("monitoring_fields")
    .select("idx")
    .eq("section_id", sectionId)
    .order("idx", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eIdx && eIdx.code !== "PGRST116") {
    return NextResponse.json({ error: eIdx.message }, { status: 500 });
  }

  const nextIdx = (last?.idx ?? -1) + 1;

  const { data: field, error } = await supabase
    .from("monitoring_fields")
    .insert({
      section_id: sectionId,
      idx: nextIdx,
      type,
      label,
      options: type === "radio" ? options : [],
    })
    .select("id, section_id, idx, type, label, options, help")
    .single();

  if (error) {
    console.error(
      "[ADD FIELD ERROR]",
      { sectionId, type, label, options },
      error
    );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ field });
}

// src/app/api/monitoring/daily/eval-fields/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/server";

async function isSuperAdminCookie() {
  try {
    const jar = await cookies();
    return jar.get("super_admin")?.value === "1";
  } catch {
    return false;
  }
}

/**
 * PATCH /api/monitoring/daily/eval-fields?id=<uuid>
 * body: { label?: string, help?: string | null, idx?: number, options?: jsonb, group_*?:, type?: string }
 * - Super admin only
 */
export async function PATCH(req: Request) {
  if (!(await isSuperAdminCookie())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const patch: any = {};
  if ("label" in body) patch.label = body.label;
  if ("help" in body) patch.help = body.help;
  if ("idx" in body) patch.idx = body.idx;
  if ("options" in body) patch.options = body.options;
  if ("group_key" in body) patch.group_key = body.group_key;
  if ("group_label" in body) patch.group_label = body.group_label;
  if ("group_order" in body) patch.group_order = body.group_order;
  if ("type" in body) patch.type = body.type;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("feature_fields")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ field: data });
}

/**
 * DELETE /api/monitoring/daily/eval-fields?id=<uuid>
 * - Super admin only
 */
export async function DELETE(req: Request) {
  if (!(await isSuperAdminCookie())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getServiceSupabase();

  // jika kamu punya nilai di table lain terkait field (mis. et_values), FK/ON DELETE CASCADE akan membantu
  const { error } = await supabase.from("feature_fields").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

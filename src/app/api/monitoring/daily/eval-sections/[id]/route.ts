// src/app/api/monitoring/daily/eval-sections/[id]/route.ts
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
 * PATCH /api/monitoring/daily/eval-sections?id=<uuid>
 * body: { title?: string, idx?: number }
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
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.idx === "number") patch.idx = body.idx;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("feature_sections")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ section: data });
}

/**
 * DELETE /api/monitoring/daily/eval-sections?id=<uuid>
 * - Hapus section (ON DELETE CASCADE akan menghapus fields jika FK diaktifkan)
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
  const { error } = await supabase
    .from("feature_sections")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

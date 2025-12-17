import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function isSuperAdmin() {
  try {
    const jar = await cookies();
    return jar.get("super_admin")?.value === "1";
  } catch {
    return false;
  }
}

/* ===== PATCH: update member (SUPER ONLY) =====
   body: { name?: string, idx?: number, is_active?: boolean }
*/
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isSuperAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};

    if (typeof body?.name === "string") patch.name = String(body.name).trim();
    if (Number.isFinite(body?.idx)) patch.idx = Number(body.idx);
    if (typeof body?.is_active === "boolean") patch.is_active = body.is_active;

    if (!Object.keys(patch).length)
      return NextResponse.json(
        { error: "Tidak ada perubahan" },
        { status: 400 }
      );

    const srv = getServiceSupabase();
    const { error } = await srv.from("role_members").update(patch).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update member" },
      { status: 500 }
    );
  }
}

/* ===== DELETE: delete member (SUPER ONLY) ===== */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isSuperAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = params.id;
    const srv = getServiceSupabase();
    const { error } = await srv.from("role_members").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete member" },
      { status: 500 }
    );
  }
}

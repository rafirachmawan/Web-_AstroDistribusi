import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// PATCH /api/monitoring/daily/sections/:id
// body: { title?: string, idx?: number, weekly_open?: (string[] | number[]) }
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // params harus di-await
) {
  try {
    const { id } = await ctx.params;
    const srv = getServiceSupabase();

    const body = (await req.json().catch(() => ({}))) ?? {};
    const titleRaw =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const idxRaw = Number.isFinite(body.idx) ? Number(body.idx) : undefined;
    const weeklyOpenRaw = Array.isArray(body.weekly_open)
      ? body.weekly_open
      : undefined;

    if (titleRaw == null && idxRaw == null && weeklyOpenRaw == null) {
      return NextResponse.json(
        { error: "Nothing to patch (title/idx/weekly_open kosong)" },
        { status: 400 }
      );
    }

    const patch: Record<string, any> = {};
    if (titleRaw != null) patch.title = titleRaw;
    if (idxRaw != null) patch.idx = idxRaw;

    // NEW: weekly_open (array tanggal). Jika tidak dikirim, jangan diubah.
    // Jika ingin “ikut global”, kirim [] dari client.
    if (Array.isArray(weeklyOpenRaw)) {
      const list = weeklyOpenRaw
        .map((v: any) => String(v ?? ""))
        .map((s) =>
          s.length === 8
            ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
            : s
        )
        .map((s) => s.slice(0, 10))
        .filter(Boolean);
      patch.weekly_open = list;
    }

    const { data, error } = await srv
      .from("feature_sections")
      .update(patch)
      .eq("id", id)
      .select(
        `
        id,
        title,
        idx,
        role_key,
        period,
        weekly_open,
        fields:feature_fields(*)
      `
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ section: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update section" },
      { status: 500 }
    );
  }
}

// DELETE /api/monitoring/daily/sections/:id
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // konsisten: await params
) {
  try {
    const { id } = await ctx.params;
    const srv = getServiceSupabase();

    // hapus semua field di section (jika FK belum cascade)
    await srv.from("feature_fields").delete().eq("section_id", id);

    const { error } = await srv.from("feature_sections").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete section" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const sb = await getServerSupabase();
    const {
      role_key,
      date_iso,
      depo,
      leader,
      rows, // [{member, scores:{critId:number}, total, notes}]
    } = await req.json();

    if (!role_key || !date_iso || !depo || !leader || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Payload tidak lengkap" },
        { status: 400 }
      );
    }

    // Simpan 1 baris per member, gunakan kolom yg sudah ada:
    // team_evaluations(date_iso, workday, category, member, scores, total, notes, created_by)
    // gunakan: category = role_key (biar filter mudah)
    const inserts = rows.map((r: any) => ({
      date_iso,
      workday: 0,
      category: role_key,
      member: r.member,
      scores: r.scores || {},
      total: Number(r.total || 0),
      notes: r.notes || "",
    }));

    const { error } = await sb.from("team_evaluations").insert(inserts);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save" },
      { status: 500 }
    );
  }
}

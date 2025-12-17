import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    if (!role)
      return NextResponse.json({ error: "role wajib" }, { status: 400 });

    const sb = await getServerSupabase();

    const { data: tmpl, error: e1 } = await sb
      .from("team_eval_templates")
      .select("criteria")
      .eq("role_key", role)
      .maybeSingle();
    if (e1) throw e1;

    const { data: memb, error: e2 } = await sb
      .from("team_eval_members")
      .select("members")
      .eq("role_key", role)
      .maybeSingle();
    if (e2) throw e2;

    return NextResponse.json({
      criteria: tmpl?.criteria ?? [],
      members: memb?.members ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }
}

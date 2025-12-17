import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const srv = getServiceSupabase();

    const body = await req.json().catch(() => ({}));
    const role_key: string | undefined = body?.role_key;
    const members: any[] = Array.isArray(body?.members) ? body.members : [];

    if (!role_key)
      return NextResponse.json({ error: "role_key wajib" }, { status: 400 });

    const { data: exists, error: e1 } = await srv
      .from("team_eval_members")
      .select("role_key")
      .eq("role_key", role_key)
      .maybeSingle();
    if (e1) throw e1;

    if (exists) {
      const { error } = await srv
        .from("team_eval_members")
        .update({ members })
        .eq("role_key", role_key);
      if (error) throw error;
    } else {
      const { error } = await srv
        .from("team_eval_members")
        .insert({ role_key, members });
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }
}

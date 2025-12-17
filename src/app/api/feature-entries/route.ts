import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feature_key, payload, date_key } = body;

    const supabase = await getServerSupabase();
    const {
      data: { user },
      error: uErr,
    } = await supabase.auth.getUser();
    if (uErr || !user) {
      return NextResponse.json(
        { error: uErr?.message || "Unauthenticated" },
        { status: 401 }
      );
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("role_key")
      .eq("user_id", user.id)
      .single();

    const roleKey = prof?.role_key ?? null;

    const { error: insErr } = await supabase.from("feature_entries").insert({
      user_id: user.id,
      role_key: roleKey,
      feature_key,
      date_key: date_key ?? null,
      payload,
    });

    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

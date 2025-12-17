import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "tokens missing" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return NextResponse.json({ ok: true, user_id: user?.id ?? null });
}

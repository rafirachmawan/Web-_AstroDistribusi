import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await getServerSupabase();

    // user
    const { data: u, error: eUser } = await supabase.auth.getUser();
    if (eUser) throw eUser;
    const uid = u.user?.id || null;
    if (!uid) return NextResponse.json({ user: null, profile: null });

    // profile (ambil role_key)
    const { data: prof, error: eProf } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, role_key")
      .eq("user_id", uid)
      .maybeSingle();

    if (eProf) throw eProf;

    return NextResponse.json({
      user: { id: uid, email: u.user?.email ?? null },
      profile: prof ? { ...prof } : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { user: null, profile: null, error: err?.message || "whoami failed" },
      { status: 200 } // 200 supaya client tetap bisa parse
    );
  }
}

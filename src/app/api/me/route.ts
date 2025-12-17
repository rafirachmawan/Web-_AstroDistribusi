import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let leader: string | null = null;
  let depo: string | null = null;

  if (user?.id) {
    // Ambil profil dari tabel "profiles" (silakan sesuaikan kolomnya)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,depo")
      .eq("user_id", user.id)
      .maybeSingle();

    leader = profile?.full_name ?? user.email ?? null;
    depo = profile?.depo ?? null;
  }

  return NextResponse.json({ leader, depo });
}

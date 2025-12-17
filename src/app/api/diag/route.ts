// src/app/api/diag/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const jar = await cookies();
  const superCookie = jar.get("super_admin")?.value ?? null;

  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return NextResponse.json({
    super_admin_cookie: superCookie,
    user_id: user?.id ?? null,
    supabase_error: error?.message ?? null,
  });
}

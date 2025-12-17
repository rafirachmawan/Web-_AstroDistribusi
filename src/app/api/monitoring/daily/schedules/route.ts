import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role");
  if (!role)
    return NextResponse.json({ error: "Missing role" }, { status: 400 });
  const srv = getServiceSupabase();
  const { data } = await srv
    .from("checklist_period_schedules")
    .select("weekly, monthly")
    .eq("role_key", role)
    .maybeSingle();
  return NextResponse.json({
    weekly: data?.weekly ?? [],
    monthly: data?.monthly ?? [],
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = body?.role as string;
  if (!role)
    return NextResponse.json({ error: "Missing role" }, { status: 400 });
  const weekly: number[] | undefined = body?.weekly;
  const monthly: number[] | undefined = body?.monthly;
  const srv = getServiceSupabase();

  const patch: any = {};
  if (Array.isArray(weekly)) patch.weekly = weekly;
  if (Array.isArray(monthly)) patch.monthly = monthly;

  const { error } = await srv
    .from("checklist_period_schedules")
    .upsert([{ role_key: role, ...patch }], { onConflict: "role_key" });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

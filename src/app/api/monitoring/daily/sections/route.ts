import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Period = "daily" | "weekly" | "monthly";

async function getMyRoleKey(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>
) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("user_id", uid)
    .maybeSingle();

  return prof?.role_key ?? null;
}

// GET ?feature=checklist&role=<role>&period=<daily|weekly|monthly>&withFields=1
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const feature = url.searchParams.get("feature") ?? "checklist";
    const qRole = url.searchParams.get("role") || null;
    const period = (url.searchParams.get("period") as Period) || "daily";
    const withFields = url.searchParams.get("withFields") === "1";

    const supabase = await getServerSupabase();
    const myRole = await getMyRoleKey(supabase);
    if (!myRole) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    const ELEVATED = new Set(["it", "direktur", "hrd"]);
    const roleToView = ELEVATED.has(myRole) && qRole ? qRole : myRole;

    // Ambil sections per (feature + role + period)
    const { data: secs, error: eSec } = await supabase
      .from("feature_sections")
      .select("id, title, idx, role_key, period, weekly_open") // ⬅️ tambahkan weekly_open
      .eq("feature_key", feature)
      .eq("role_key", roleToView)
      .eq("period", period)
      .order("idx", { ascending: true });

    if (eSec) throw eSec;

    const sections = secs ?? [];
    let fieldsBySection: Record<string, any[]> = {};

    if (withFields && sections.length) {
      const ids = sections.map((s) => s.id);
      const { data: fields, error: eFld } = await supabase
        .from("feature_fields")
        .select(
          "id, section_id, type, label, help, idx, options, suffix, min, max, placeholder, group_key, group_label, group_order"
        )
        .in("section_id", ids)
        .order("group_key", { ascending: true, nullsFirst: true })
        .order("group_order", { ascending: true, nullsFirst: true })
        .order("idx", { ascending: true });

      if (eFld) throw eFld;

      fieldsBySection = (fields || []).reduce(
        (acc: Record<string, any[]>, f: any) => {
          (acc[f.section_id] ??= []).push(f);
          return acc;
        },
        {}
      );
    }

    const withFieldsArr = sections.map((s) => ({
      ...s,
      fields: withFields ? fieldsBySection[s.id] ?? [] : [],
    }));

    return NextResponse.json({
      sections: withFieldsArr,
      role: roleToView,
      period,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

// POST body: { title, feature?, role_key?, period }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    const feature = String(body?.feature ?? "checklist");
    const bodyRoleKey =
      typeof body?.role_key === "string" ? body.role_key.trim() : null;
    const period = String(body?.period ?? "daily") as Period;

    if (!title) {
      return NextResponse.json({ error: "Title wajib diisi" }, { status: 400 });
    }
    if (!["daily", "weekly", "monthly"].includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const supabase = await getServerSupabase();
    const srv = getServiceSupabase();

    const myRole = await getMyRoleKey(supabase);
    if (!myRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 403 });
    }

    const ELEVATED = new Set(["it", "direktur", "hrd"]);
    const roleKeyForNew =
      ELEVATED.has(myRole) && bodyRoleKey ? bodyRoleKey : myRole;

    // idx berikutnya berdasarkan (feature + role + period)
    const { data: maxIdxRows, error: e1 } = await srv
      .from("feature_sections")
      .select("idx")
      .eq("feature_key", feature)
      .eq("role_key", roleKeyForNew)
      .eq("period", period)
      .order("idx", { ascending: false })
      .limit(1);

    if (e1) throw e1;

    const nextIdx = (maxIdxRows?.[0]?.idx ?? -1) + 1;

    const { data, error: e2 } = await srv
      .from("feature_sections")
      .insert([
        {
          feature_key: feature,
          role_key: roleKeyForNew,
          period,
          title,
          idx: nextIdx,
          // weekly_open bisa null saat create; nanti di PATCH bisa diisi
        },
      ])
      .select("id, title, idx, role_key, period, weekly_open") // ⬅️ kirim balik weekly_open
      .single();

    if (e2) throw e2;

    return NextResponse.json({ section: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create section" },
      { status: 500 }
    );
  }
}

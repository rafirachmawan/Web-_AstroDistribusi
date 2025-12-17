import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

function dayName(dow: number) {
  // 1..7  => Sen..Min
  const names = [
    "",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];
  return names[dow] ?? String(dow);
}

async function isSuper() {
  try {
    const jar = await cookies();
    return jar.get("super_admin")?.value === "1";
  } catch {
    return false;
  }
}

async function getUserRoleKey(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role_key, role, user_id, id")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  return (prof?.role_key as string) ?? (prof?.role as string) ?? null;
}

/**
 * GET /api/monitoring/daily/checklist-sections
 *    ?date=YYYY-MM-DD         (opsional, default hari ini)
 *    ?role=<role_key>         (hanya efektif untuk super admin)
 *    ?withFields=1            (ikutkan fields)
 *
 * Logika HARI:
 * - Jika role+feature PUNYA jadwal mingguan di table feature_section_schedules:
 *     -> Hari yg tidak punya row = KOSONG (TIDAK fallback).
 * - Jika role+feature TIDAK punya jadwal sama sekali:
 *     -> Fallback ke SEMUA section role tsb (fleksibel utk role lain).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const feature = "checklist_area";
    const withFields = url.searchParams.get("withFields") === "1";
    const qRole = url.searchParams.get("role") || "";

    // Tanggal & DOW
    const dstr = url.searchParams.get("date");
    const baseDate = dstr ? new Date(dstr) : new Date();
    const jsDay = baseDate.getDay(); // 0=Sun..6=Sat
    const dow = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun

    const supabase = await getServerSupabase();
    const isSA = await isSuper();
    const profileRole = await getUserRoleKey(supabase);
    const role = isSA ? qRole || profileRole : profileRole;

    if (!role) {
      return NextResponse.json({
        meta: {
          role: null,
          date: baseDate.toISOString().slice(0, 10),
          dow,
          day_name: dayName(dow),
          has_weekly_schedule: false,
          today_scheduled: false,
          weekly: [],
        },
        sections: [],
      });
    }

    // --- Ambil seluruh jadwal untuk role+feature (satu pekan)
    const { data: weekly, error: eW } = await supabase
      .from("feature_section_schedules")
      .select("dow, section_id")
      .eq("feature_key", feature)
      .eq("role_key", role);

    if (eW) throw eW;

    const hasWeekly = (weekly?.length ?? 0) > 0;
    const todays = (weekly ?? []).filter((x: any) => x.dow === dow);
    const todayHasSchedule = todays.length > 0;

    // Buat map untuk lookup judul section pada meta (khusus super admin)
    let titleById: Record<string, string> = {};
    if (hasWeekly) {
      const allIds = Array.from(
        new Set((weekly ?? []).map((x: any) => x.section_id))
      );
      if (allIds.length) {
        const { data: secTitles } = await supabase
          .from("feature_sections")
          .select("id, title")
          .in("id", allIds);
        for (const s of secTitles ?? []) titleById[s.id] = s.title;
      }
    }

    // --- Ambil sections untuk HARI INI
    let secs: any[] = [];

    if (hasWeekly) {
      // Ada jadwal mingguan ⇒ HARI yang tidak dijadwalkan HARUS KOSONG
      if (todayHasSchedule) {
        const idsToday = todays.map((x: any) => x.section_id);
        const { data, error } = await supabase
          .from("feature_sections")
          .select("id, title, idx")
          .in("id", idsToday)
          .order("idx", { ascending: true });
        if (error) throw error;
        secs = data ?? [];
      } else {
        // Tidak ada row untuk hari ini ⇒ kosong
        secs = [];
      }
    } else {
      // Tidak ada jadwal sama sekali ⇒ fallback (fleksibel)
      const { data, error } = await supabase
        .from("feature_sections")
        .select("id, title, idx")
        .eq("feature_key", feature)
        .eq("role_key", role)
        .order("idx", { ascending: true });
      if (error) throw error;
      secs = data ?? [];
    }

    // Muat fields jika diminta
    if (!withFields) {
      return NextResponse.json({
        meta: {
          role,
          date: baseDate.toISOString().slice(0, 10),
          dow,
          day_name: dayName(dow),
          has_weekly_schedule: hasWeekly,
          today_scheduled: todayHasSchedule,
          weekly: (weekly ?? []).map((w: any) => ({
            dow: w.dow,
            day_name: dayName(w.dow),
            section_id: w.section_id,
            section_title: titleById[w.section_id] ?? null,
          })),
        },
        sections: secs,
      });
    }

    const ids = secs.map((s) => s.id);
    let fields: any[] = [];
    if (ids.length > 0) {
      const { data: flds, error: e2 } = await supabase
        .from("feature_fields")
        .select("*")
        .in("section_id", ids)
        .order("idx", { ascending: true });
      if (e2) throw e2;
      fields = flds ?? [];
    }

    const withChildren = secs.map((s) => ({
      ...s,
      fields: fields.filter((f) => f.section_id === s.id),
    }));

    return NextResponse.json({
      meta: {
        role,
        date: baseDate.toISOString().slice(0, 10),
        dow,
        day_name: dayName(dow),
        has_weekly_schedule: hasWeekly,
        today_scheduled: todayHasSchedule,
        weekly: (weekly ?? []).map((w: any) => ({
          dow: w.dow,
          day_name: dayName(w.dow),
          section_id: w.section_id,
          section_title: titleById[w.section_id] ?? null,
        })),
      },
      sections: withChildren,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

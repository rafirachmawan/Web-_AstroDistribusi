import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const feature = url.searchParams.get("feature");
  if (!feature)
    return NextResponse.json({ error: "feature required" }, { status: 400 });

  const supabase = await getServerSupabase();

  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user)
    return NextResponse.json(
      { error: uErr?.message || "Unauthenticated" },
      { status: 401 }
    );

  const { data: prof } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("user_id", user.id)
    .single();

  const roleKey = prof?.role_key ?? null;

  // allow-list via role_features (kecuali role super)
  const { data: allow } = await supabase
    .from("role_features")
    .select("feature_key")
    .eq("role_key", roleKey)
    .eq("feature_key", feature)
    .maybeSingle();

  if (!allow && !["it", "direktur", "hrd"].includes(roleKey || "")) {
    return NextResponse.json({ sections: [], fields: [] });
  }

  const { data: sections, error: sErr } = await supabase
    .from("feature_sections")
    .select("id,title,idx")
    .eq("feature_key", feature)
    .or(`role_key.is.null,role_key.eq.${roleKey || "null"}`)
    .order("idx", { ascending: true });

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const sectionIds = (sections ?? []).map((s) => s.id);
  if (sectionIds.length === 0)
    return NextResponse.json({ sections: [], fields: [] });

  const { data: fields, error: fErr } = await supabase
    .from("feature_fields")
    .select("id,section_id,label,type,options,required,help,idx")
    .in("section_id", sectionIds)
    .order("idx", { ascending: true });

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  return NextResponse.json({ sections, fields });
}

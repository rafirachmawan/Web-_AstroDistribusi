import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

async function isSuper() {
  try {
    const jar = await cookies();
    return jar.get("super_admin")?.value === "1";
  } catch {
    return false;
  }
}

/**
 * Ambil role user dari tabel profiles berdasarkan auth.user.id
 * - Mengambil role_key dulu; fallback ke role (text/enum lama)
 */
async function getProfileRoleKey(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // skema kamu: kolom PK = user_id
  const { data: prof, error } = await supabase
    .from("profiles")
    .select("role_key, role, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  return (prof?.role_key as string) ?? (prof?.role as string) ?? null;
}

/**
 * GET ?feature=eval_team&role=<role_key>&withFields=1
 * - Non-super: abaikan ?role → selalu pakai role milik user
 * - Super: boleh override ?role (kalau kosong, pakai role milik user)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const feature = url.searchParams.get("feature") || "eval_team";
  const qRole = url.searchParams.get("role") || "";
  const withFields = url.searchParams.get("withFields") === "1";

  const supabase = await getServerSupabase();
  const superMode = await isSuper();
  const profileRole = await getProfileRoleKey(supabase);
  const role = superMode ? qRole || profileRole : profileRole;

  if (!role) return NextResponse.json({ sections: [] });

  // SELALU filter role_key = role → ini yang mencegah “semua role” ikut tampil
  const { data: secs, error } = await supabase
    .from("feature_sections")
    .select("id, title, idx")
    .eq("feature_key", feature)
    .eq("role_key", role)
    .order("idx", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!secs?.length) return NextResponse.json({ sections: [] });

  if (!withFields) return NextResponse.json({ sections: secs });

  const ids = secs.map((s) => s.id);
  const { data: flds, error: e2 } = await supabase
    .from("feature_fields")
    .select("*")
    .in("section_id", ids)
    .order("idx", { ascending: true });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const withChildren = secs.map((s) => ({
    ...s,
    fields: (flds || []).filter((f) => f.section_id === s.id),
  }));

  return NextResponse.json({ sections: withChildren });
}

/* Super-admin only mutations di bawah (optional) */

export async function POST(req: Request) {
  if (!(await isSuper()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const supabase = await getServerSupabase();
    const body = await req.json();
    const title = (body?.title || "").trim();
    const feature = (body?.feature || "eval_team").trim();
    const role_key = (body?.role_key || "").trim();
    if (!title || !role_key)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const { data: last } = await supabase
      .from("feature_sections")
      .select("idx")
      .eq("feature_key", feature)
      .eq("role_key", role_key)
      .order("idx", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextIdx = (last?.idx ?? 0) + 1;

    const { data, error } = await supabase
      .from("feature_sections")
      .insert({ feature_key: feature, role_key, title, idx: nextIdx })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ section: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!(await isSuper()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const body = await req.json();
    const title = (body?.title || "").trim();
    if (!id || !title)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("feature_sections")
      .update({ title })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await isSuper()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await getServerSupabase();
    // hapus child fields dulu (aman jika belum pakai FK cascade)
    const { error: e1 } = await supabase
      .from("feature_fields")
      .delete()
      .eq("section_id", id);
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from("feature_sections")
      .delete()
      .eq("id", id);
    if (e2) throw e2;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed" },
      { status: 500 }
    );
  }
}

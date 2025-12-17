import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET ?date=YYYY-MM-DD&role=<role_key>
 * Mengembalikan form (jika ada), values (array), serta header opsional.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const role = searchParams.get("role");

    if (!date || !role) {
      return NextResponse.json({ error: "date & role wajib" }, { status: 400 });
    }

    const sb = await getServerSupabase();
    const { data: form } = await sb
      .from("et_forms")
      .select("id, form_date, role_key, leader, depo")
      .eq("form_date", date)
      .eq("role_key", role)
      .maybeSingle();

    if (!form) return NextResponse.json({ form: null, values: [] });

    const { data: values, error: e2 } = await sb
      .from("et_values")
      .select("field_id, member, score")
      .eq("form_id", form.id);

    if (e2) throw e2;
    return NextResponse.json({ form, values: values ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed" },
      { status: 500 }
    );
  }
}

/**
 * POST menyimpan 1 form (upsert by (date, role)) + semua nilai.
 * body: { form_date, role_key, leader?, depo?, rows: Array<{ field_id, member, score }> }
 */
export async function POST(req: Request) {
  try {
    const sb = await getServerSupabase();
    const body = await req.json().catch(() => ({}));

    const form_date = String(body?.form_date ?? "").slice(0, 10);
    const role_key = String(body?.role_key ?? "");
    const leader = body?.leader ? String(body.leader) : null;
    const depo = body?.depo ? String(body.depo) : null;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!form_date || !role_key || rows.length === 0) {
      return NextResponse.json(
        { error: "form_date, role_key, rows wajib" },
        { status: 400 }
      );
    }

    // upsert form
    const { data: up, error: e1 } = await sb
      .from("et_forms")
      .upsert([{ form_date, role_key, leader, depo }], {
        onConflict: "form_date,role_key",
      })
      .select("id")
      .single();

    if (e1) throw e1;
    const formId = up.id;

    // siapkan payload et_values
    const items = rows
      .map((r: any) => {
        const field_id = String(r?.field_id ?? "");
        const member = String(r?.member ?? "").trim();
        const score = Number(r?.score ?? 0);
        if (!field_id || !member || !(score >= 1 && score <= 5)) return null;
        return { form_id: formId, field_id, member, score };
      })
      .filter(Boolean) as Array<{
      form_id: string;
      field_id: string;
      member: string;
      score: number;
    }>;

    if (items.length === 0) {
      return NextResponse.json(
        { error: "rows kosong/invalid" },
        { status: 400 }
      );
    }

    // pakai UPSERT per (form_id, field_id, member)
    const { error: e2 } = await sb
      .from("et_values")
      .upsert(items, { onConflict: "form_id,field_id,member" });

    if (e2) throw e2;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed" },
      { status: 500 }
    );
  }
}

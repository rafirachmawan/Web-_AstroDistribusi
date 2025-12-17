import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// GET ?date=YYYY-MM-DD&depo=...
export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const url = new URL(req.url);
  const form_date = url.searchParams.get("date");
  const depo = url.searchParams.get("depo") || "";

  if (!form_date)
    return Response.json({ error: "date wajib" }, { status: 400 });

  const { data: form } = await supabase
    .from("ml_daily_forms")
    .select("id, form_date, depo, leader")
    .eq("form_date", form_date)
    .eq("depo", depo)
    .maybeSingle();

  if (!form) return Response.json({ form: null, values: {} });

  const { data: rows } = await supabase
    .from("ml_field_values")
    .select("field_id,value_text")
    .eq("form_id", form.id);

  const values: Record<string, string> = {};
  (rows || []).forEach((r) => (values[r.field_id] = r.value_text ?? ""));
  return Response.json({ form, values });
}

// POST: { date,depo,leader, values: { [field_id]: string } }
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const { date, depo = "", leader = "", values = {} } = body || {};
  if (!date) return Response.json({ error: "date wajib" }, { status: 400 });

  // upsert form header
  const { data: upserted, error: e1 } = await supabase
    .from("ml_daily_forms")
    .upsert([{ form_date: date, depo, leader }], {
      onConflict: "form_date,depo",
    })
    .select("id")
    .single();

  if (e1) return Response.json({ error: e1.message }, { status: 400 });
  const form_id = upserted!.id;

  // upsert values
  const payload = Object.entries(values).map(([field_id, value_text]) => ({
    form_id,
    field_id,
    value_text: String(value_text ?? ""),
  }));

  if (payload.length) {
    const { error: e2 } = await supabase
      .from("ml_field_values")
      .upsert(payload, { onConflict: "form_id,field_id" });
    if (e2) return Response.json({ error: e2.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}

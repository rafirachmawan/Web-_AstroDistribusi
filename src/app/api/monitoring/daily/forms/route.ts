// ==============================
// FILE: src/app/api/monitoring/daily/forms/route.ts
// ==============================
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

/* ========== Types dari FE (ChecklistClient) ========== */
type IncomingValue = {
  section_id: string;
  field_id: string;
  type: string;
  value: any;
};

type DbRow = {
  section_id: string | null;
  field_id: string | null;
  type: string | null;
  value_text: string | null;
  value_number: number | null;
  value_display?: string | null;
  leader?: string | null;
  depo?: string | null;
  role_key?: string | null;
};

type LockRow = {
  form_date: string;
  depo: string;
  leader: string;
  role?: string | null;
  role_key?: string | null;
  pdf_url?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
};

/* =========================
   Helpers: cek LOCK
========================= */
async function getLock(opts: {
  form_date: string;
  depo: string;
  leader?: string;
  role?: string | null;
  role_key?: string | null;
}): Promise<LockRow | null> {
  const supa = getServiceSupabase();
  const { form_date, depo, leader } = opts;
  const role_key = (opts.role_key ?? opts.role ?? "").trim();

  let q = supa
    .from("monitoring_form_locks")
    .select("form_date,depo,leader,role,role_key,pdf_url,locked_at,locked_by")
    .eq("form_date", form_date)
    .eq("depo", depo);

  if (leader && leader.trim() !== "") q = q.eq("leader", leader.trim());

  // lock lama bisa simpan di kolom `role` atau `role_key`
  if (role_key) {
    q = q.or(`role_key.eq.${role_key},role.eq.${role_key}`);
  }

  const { data, error } = await q.limit(1);
  if (error) return null;
  return data && data[0] ? (data[0] as LockRow) : null;
}

/* =========================
   Helper: ambil label metadata field & section
========================= */
async function loadMetaMaps(
  supa: any,
  fieldIds: string[],
  sectionIds: string[]
) {
  const fieldLabel = new Map<string, string>();
  const sectionTitle = new Map<string, string>();

  // 1) coba monitoring_*
  try {
    if (sectionIds.length) {
      const { data: ms } = await supa
        .from("monitoring_sections")
        .select("id,title")
        .in("id", sectionIds);
      (ms ?? []).forEach((s: any) =>
        sectionTitle.set(String(s.id), s.title || "")
      );
    }

    if (fieldIds.length) {
      const { data: mf } = await supa
        .from("monitoring_fields")
        .select("id,label,section_id")
        .in("id", fieldIds);

      (mf ?? []).forEach((f: any) => {
        fieldLabel.set(String(f.id), f.label || "");
      });
    }

    if (fieldLabel.size || sectionTitle.size) {
      return { fieldLabel, sectionTitle };
    }
  } catch {
    // ignore → fallback
  }

  // 2) fallback feature_*
  try {
    if (sectionIds.length) {
      const { data: fs } = await supa
        .from("feature_sections")
        .select("id,title")
        .in("id", sectionIds);
      (fs ?? []).forEach((s: any) =>
        sectionTitle.set(String(s.id), s.title || "")
      );
    }
    if (fieldIds.length) {
      const { data: ff } = await supa
        .from("feature_fields")
        .select("id,label,section_id")
        .in("id", fieldIds);
      (ff ?? []).forEach((f: any) => {
        fieldLabel.set(String(f.id), f.label || "");
      });
    }
  } catch {
    // ignore
  }

  return { fieldLabel, sectionTitle };
}

/* =========================
   Helper: normalize value dari FE biar tampil di PDF
========================= */
function normalizeDisplayValue(v: any): string {
  if (v === undefined || v === null) return "";

  // checkbox array → join
  if (Array.isArray(v)) {
    return v
      .map((x) => normalizeDisplayValue(x))
      .filter((s) => String(s).trim() !== "")
      .join(", ");
  }

  // object umum (dropdown/react-select style)
  if (typeof v === "object") {
    // kalau {label, value}
    if ("label" in v && (v as any).label != null)
      return String((v as any).label);
    if ("value" in v && (v as any).value != null)
      return String((v as any).value);

    // fallback aman
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  return String(v);
}

/**
 * true = value dianggap "ada isi" (layak disimpan)
 * false = kosong → jangan ikut upsert (biar gak nimpah data lama jadi kosong)
 */
function isMeaningfulValue(dbType: string, display: string, raw: any) {
  // ✅ model_grid: jangan timpa kalau kosong
  if (dbType === "model_grid") {
    if (Array.isArray(raw)) return raw.length > 0;
    if (typeof raw === "object" && raw) return Object.keys(raw).length > 0;

    const s = String(display ?? "").trim();
    return s !== "" && s !== "[]" && s !== "{}";
  }

  // invoice / po_delay: string/json, kalau benar2 kosong -> false
  if (dbType === "invoice" || dbType === "po_delay") {
    const s = String(raw ?? "");
    return s.trim() !== "" && s.trim() !== "[]" && s.trim() !== "{}";
  }

  // angka: anggap kosong kalau NaN atau 0
  if (dbType === "number" || dbType === "currency") {
    const num =
      typeof raw === "number"
        ? raw
        : Number(String(display ?? "0").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) && num !== 0;
  }

  // text: kosong = false
  return String(display ?? "").trim() !== "";
}

/* ========== GET: ambil nilai tersimpan ========== */
export async function GET(req: NextRequest) {
  try {
    const supa = getServiceSupabase();
    const url = new URL(req.url);

    const form_date = url.searchParams.get("date");
    const depo = (url.searchParams.get("depo") ?? "").trim();
    const period = (url.searchParams.get("period") ?? "daily").trim();

    const leader = (url.searchParams.get("leader") ?? "").trim();
    const role_key = (
      url.searchParams.get("role_key") ??
      url.searchParams.get("role") ??
      ""
    ).trim();

    if (!form_date)
      return NextResponse.json({ error: "date wajib" }, { status: 400 });
    if (!depo)
      return NextResponse.json({ error: "depo wajib" }, { status: 400 });

    // ✅ cek lock dulu
    const lock = await getLock({
      form_date,
      depo,
      leader: leader || undefined,
      role_key: role_key || null,
    });

    if (lock) {
      return NextResponse.json({ locked: true, lock, form: null, values: [] });
    }

    let q = supa
      .from("monitoring_checklist_values")
      .select(
        "section_id, field_id, type, value_text, value_number, value_display, leader, depo, role_key"
      )
      .eq("form_date", form_date)
      .eq("depo", depo)
      .eq("period", period);

    if (leader) q = q.eq("leader", leader);

    // role_key opsional:
    // - kalau FE kirim role_key, filter itu
    // - kalau kosong, biarkan ambil semua (super admin)
    if (role_key) q = q.eq("role_key", role_key);

    const { data, error } = await q;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (data ?? []) as DbRow[];

    const form =
      rows.length > 0
        ? {
            form_date,
            depo: rows[0].depo ?? depo,
            leader: rows[0].leader ?? leader ?? "",
            period,
          }
        : null;

    const values = rows.map((r) => ({
      section_id: r.section_id!,
      field_id: r.field_id!,
      value_text: r.value_text,
      value_number: r.value_number,
      value_display: (r as any).value_display ?? null,
    }));

    return NextResponse.json({ locked: false, form, values });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/* ========== POST: simpan semua nilai checklist untuk 1 hari ========== */
export async function POST(req: NextRequest) {
  try {
    const supa = getServiceSupabase();
    const body = (await req.json()) as {
      form_date?: string;
      date?: string;
      depo?: string;
      leader?: string;
      period?: string;
      role?: string | null;
      role_key?: string | null;
      values?: IncomingValue[];
    };

    const form_date = body.form_date || body.date;
    const depo = (body.depo ?? "").trim();
    const leader = (body.leader ?? "").trim();
    const period = (body.period ?? "daily").trim() as
      | "daily"
      | "weekly"
      | "monthly";
    const role_key = ((body.role_key ?? body.role ?? "") as string).trim();

    if (!form_date)
      return NextResponse.json(
        { error: "form_date/date wajib" },
        { status: 400 }
      );
    if (!depo)
      return NextResponse.json({ error: "depo wajib" }, { status: 400 });
    if (!leader)
      return NextResponse.json({ error: "leader wajib" }, { status: 400 });

    // ✅ cek lock
    const lock = await getLock({
      form_date,
      depo,
      leader,
      role_key: role_key || null,
    });
    if (lock) {
      return NextResponse.json(
        {
          error: "Form sudah FINAL / terkunci. Tidak bisa diubah.",
          locked: true,
          lock,
        },
        { status: 409 }
      );
    }

    const values = Array.isArray(body.values) ? body.values : [];
    if (values.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    // ambil meta label supaya PDF tidak jadi UUID
    const fieldIds = Array.from(
      new Set(values.map((v) => v.field_id).filter(Boolean))
    );
    const sectionIds = Array.from(
      new Set(values.map((v) => v.section_id).filter(Boolean))
    );

    const { fieldLabel, sectionTitle } = await loadMetaMaps(
      supa,
      fieldIds,
      sectionIds
    );

    // ✅ build rowsToUpsert (skip value kosong)
    const rowsToUpsert = values
      .map((v) => {
        const t = String(v.type || "").toLowerCase();

        let dbType: string;
        if (t === "number") dbType = "number";
        else if (t === "currency") dbType = "currency";
        else if (t === "invoice") dbType = "invoice";
        else if (t === "po_delay") dbType = "po_delay";
        else if (t === "cycle_table") dbType = "text";
        else if (t === "model_grid") dbType = "model_grid"; // ✅ NEW
        else dbType = "text";

        // ✅ NEW: model_grid disimpan sebagai JSON string rapi
        const display =
          t === "model_grid"
            ? (() => {
                try {
                  return JSON.stringify(v.value ?? []);
                } catch {
                  return "[]";
                }
              })()
            : normalizeDisplayValue(v.value);

        // ✅ kalau kosong, jangan ikut upsert (biar gak nimpah data lama)
        if (!isMeaningfulValue(dbType, display, v.value)) return null;

        let value_text: string | null = null;
        let value_number: number | null = null;
        let value_display: string | null = null;

        if (dbType === "number" || dbType === "currency") {
          const num =
            typeof v.value === "number"
              ? v.value
              : Number(String(display ?? "0").replace(/[^\d.-]/g, ""));
          if (Number.isFinite(num)) value_number = num;
          else value_text = display;
          value_display = display;
        } else {
          value_text = display;
          value_display = display;
        }

        const secTitle = sectionTitle.get(String(v.section_id)) || null;
        const fldLabel = fieldLabel.get(String(v.field_id)) || null;

        return {
          form_date,
          depo,
          leader,
          period,
          role_key: role_key || null,

          section_id: v.section_id,
          field_id: v.field_id,

          section_title: secTitle,
          field_label: fldLabel,

          type: dbType,
          value_text,
          value_number,
          value_display,
        };
      })
      .filter(Boolean) as any[];

    // ✅ FIX: cek rowsToUpsert setelah dibuat
    if (rowsToUpsert.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    // ✅ UP SERT dengan strategi "coba conflict baru → kalau gagal, fallback conflict lama"
    const tryUpsert = async (onConflict: string) => {
      return supa
        .from("monitoring_checklist_values")
        .upsert(rowsToUpsert as any, {
          onConflict,
        });
    };

    // 1) coba conflict yang INCLUDE role_key (kalau DB sudah update unique constraint)
    let res = await tryUpsert(
      "form_date,depo,leader,period,section_id,field_id,role_key"
    );

    // 2) fallback kalau DB masih constraint lama (tanpa role_key)
    if (res.error) {
      res = await tryUpsert("form_date,depo,leader,period,section_id,field_id");
    }

    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, inserted: rowsToUpsert.length });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// ==============================
// FILE: src/app/api/monitoring/daily/history/route.ts
// ==============================
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

type Item = {
  date: string; // YYYY-MM-DD
  leader: string;
  depo: string | null;
  url: string;
  filename: string;
  role_key?: string | null;
  created_at?: string | null;
};

function parseDateISO(s?: string | null) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

// parse filename support:
// 1) YYYY-MM-DD-daily-depo-leader.pdf
// 2) YYYY-MM-DD-daily-depo-leader-YYYYMMDDHHmmss.pdf (versi)
// 3) YYYY-MM-DD-leader.pdf (lama)
function parsePdfName(name: string): {
  date: string;
  depo: string | null;
  leader: string;
  version: string | null;
} | null {
  // versi baru + optional version suffix
  // date-period-depo-leader(-version).pdf
  let m =
    name.match(
      /^(\d{4}-\d{2}-\d{2})-([^-]+)-([^-]+?)-(.+?)(?:-(\d{8,14}))?\.pdf$/i
    ) || null;

  if (m) {
    return {
      date: m[1],
      depo: m[3] || null,
      leader: m[4] || "",
      version: m[5] || null,
    };
  }

  // format lama: YYYY-MM-DD-leader.pdf
  const m2 = name.match(/^(\d{4}-\d{2}-\d{2})-(.+?)\.pdf$/i);
  if (m2) {
    return {
      date: m2[1],
      depo: null,
      leader: m2[2] || "",
      version: null,
    };
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { searchParams } = new URL(req.url);
    const leader = (searchParams.get("leader") || "").trim();
    const depo = (searchParams.get("depo") || "").trim();
    const role_key = (searchParams.get("role_key") || "").trim();
    const from = parseDateISO(searchParams.get("from"));
    const to = parseDateISO(searchParams.get("to"));

    // === 1) Ambil dari tabel history (utama) ===
    let items: Item[] = [];
    try {
      let q = supabase
        .from("monitoring_pdf_history")
        .select("date,leader,depo,url,filename,created_at,role_key")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);
      if (leader) q = q.eq("leader", leader);
      if (depo) q = q.eq("depo", depo);
      if (role_key) q = q.eq("role_key", role_key);

      const r = await q;
      if (!r.error && Array.isArray(r.data)) {
        items = r.data.map((row: any) => ({
          date: parseDateISO(row.date) || "",
          leader: row.leader || "",
          depo: row.depo ?? null,
          url: row.url || "",
          filename: row.filename || "",
          role_key: row.role_key ?? null,
          created_at: row.created_at || null,
        }));
      }
    } catch {
      // lanjut fallback storage
    }

    // === 2) Fallback: baca dari storage bucket monitoring-pdf/daily/ ===
    if (items.length === 0) {
      const bucket = "monitoring-pdf";
      const folder = "daily";
      const list = await supabase.storage.from(bucket).list(folder, {
        limit: 200,
        sortBy: { column: "name", order: "desc" },
      });

      if (!list.error && Array.isArray(list.data)) {
        const mapped: Item[] = list.data
          .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
          .map((f) => {
            const meta = parsePdfName(f.name);
            if (!meta) return null;

            const pub = supabase.storage
              .from(bucket)
              .getPublicUrl(`${folder}/${f.name}`);

            return {
              date: meta.date,
              leader: meta.leader,
              depo: meta.depo,
              url: pub.data.publicUrl,
              filename: f.name,
              created_at: (f as any).created_at || null,
              role_key: null,
            } as Item;
          })
          .filter(Boolean) as Item[];

        items = mapped.filter((it) => {
          if (!inRange(it.date, from || undefined, to || undefined))
            return false;
          if (leader && it.leader !== leader) return false;
          if (depo && (it.depo || "") !== depo) return false;
          return true;
        });

        // sort terbaru di atas (date desc, filename desc)
        items.sort((a, b) => {
          if (a.date !== b.date) return a.date < b.date ? 1 : -1;
          // pakai created_at kalau ada
          const ac = a.created_at || "";
          const bc = b.created_at || "";
          if (ac !== bc) return ac < bc ? 1 : -1;
          return a.filename < b.filename ? 1 : -1;
        });
      }
    }

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("HISTORY API ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "History error" },
      { status: 500 }
    );
  }
}

// ==============================
// FILE: src/app/api/monitoring/daily/finalize/route.ts
// ==============================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { resolveBrowserExecutable } from "@/lib/chrome-path";
import { getServiceSupabase } from "@/lib/supabase/server";

/* =========================
   1) Types
========================= */
type ChecklistItem = { point: string; value: string };
type ChecklistGroup = {
  section_id: string;
  section_title: string;
  items: ChecklistItem[];
};

type EvaluasiRow = {
  nama: string;
  hari: string;
  aspek: string;
  nilai?: string;
  catatan?: string;
};
type TargetRow = {
  item: string;
  target?: string;
  selesai?: string;
  keterangan?: string;
};
type ProjectRow = {
  title: string;
  deadline?: string | null;
  percentage?: number;
  progress?: string;
  next?: string;
  risks?: string;
};
type AgendaRow = {
  waktu: string;
  kegiatan: string;
  lokasi?: string;
  pic?: string;
};
type AchRow = { judul: string; uraian?: string; bukti?: string };

type Recap = {
  date: string;
  depo: string;
  leader: string;
  period: "daily" | "weekly" | "monthly" | string;
  checklist: ChecklistGroup[]; // <— diganti: pakai grup per-section
  evaluasi: EvaluasiRow[];
  target: TargetRow[];
  project: ProjectRow[];
  agenda: AgendaRow[];
  achievement: AchRow[];
};

/* =========================
   2) Utils
========================= */
const dash = (v?: string | number | null) =>
  v === undefined || v === null || String(v).trim() === "" ? "—" : String(v);

function toTitle(s?: string) {
  // Title Case unicode-safe
  return (s ?? "").toLowerCase().replace(/\b\p{L}/gu, (m) => m.toUpperCase());
}

function dayRange(yyyymmdd: string) {
  const start = new Date(`${yyyymmdd}T00:00:00.000Z`);
  const next = new Date(start);
  next.setUTCDate(start.getUTCDate() + 1);
  return { startISO: start.toISOString(), nextISO: next.toISOString() };
}

function periodCandidates(p: string) {
  const low = (p || "").toLowerCase();
  if (low === "daily" || low === "harian") return ["daily", "harian"];
  if (low === "weekly" || low === "mingguan") return ["weekly", "mingguan"];
  if (low === "monthly" || low === "bulanan") return ["monthly", "bulanan"];
  return [p];
}

/* =========================
   3) Ambil checklist dari DB (SELALU) → dikelompokkan per section
========================= */
async function buildChecklistFromDB(opts: {
  form_date: string;
  depo: string;
  leader?: string;
  period?: "daily" | "weekly" | "monthly" | string;
  role_key?: string | null; // ✅ TAMBAH INI
}): Promise<ChecklistGroup[]> {
  const { form_date, depo, leader, role_key } = opts;
  const period = (opts.period as any) ?? "daily";
  const supa = getServiceSupabase();

  const { startISO, nextISO } = dayRange(form_date);
  const periodOpts = periodCandidates(String(period));

  let query = supa
    .from("monitoring_checklist_values")
    .select(
      `
      id, section_id, section_title, field_id, field_label,
      value_text, value_number, value_display, type,
      form_date, depo, period, leader
    `
    )
    .eq("depo", depo);

  // Aman untuk DATE & TIMESTAMP
  query = query.or(
    [
      `form_date.eq.${form_date}`, // jika kolom DATE
      `and(form_date.gte.${startISO},form_date.lt.${nextISO})`, // jika TIMESTAMP
    ].join(",")
  );

  if (periodOpts.length === 1) query = query.eq("period", periodOpts[0]);
  else query = query.in("period", periodOpts);

  if (leader && leader.trim() !== "") query = query.eq("leader", leader.trim());
  // ✅ FILTER ROLE KEY (penting supaya PDF ambil data role yang benar)
  if (role_key && role_key.trim() !== "")
    query = query.eq("role_key", role_key.trim());
  else query = query.is("role_key", null); // supaya data lama tanpa role_key tidak nyampur

  // urut stabil: per-section lalu id
  const { data: vals, error } = await query
    .order("section_id", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;

  // Lengkapi label kalau kosong
  const needsJoin = (vals || []).filter(
    (v) => !v?.field_label || !v?.section_title
  );
  const fieldIds = Array.from(
    new Set(needsJoin.map((v) => v.field_id).filter(Boolean))
  );

  const fieldsById: Record<
    string,
    { field_label?: string; section_title?: string }
  > = {};

  if (fieldIds.length) {
    // Coba monitoring_* dulu
    try {
      const { data: mf } = await supa
        .from("monitoring_fields")
        .select("id,label,section_id");
      const { data: ms } = await supa
        .from("monitoring_sections")
        .select("id,title");
      const msMap = new Map(
        (ms || []).map((s: any) => [String(s.id), s.title])
      );
      (mf || []).forEach((f: any) => {
        fieldsById[String(f.id)] = {
          field_label: f.label,
          section_title: msMap.get(String(f.section_id)),
        };
      });
    } catch {
      // fallback feature_*
      const { data: ff } = await supa
        .from("feature_fields")
        .select("id,label,section_id");
      const { data: fs } = await supa
        .from("feature_sections")
        .select("id,title");
      const fsMap = new Map(
        (fs || []).map((s: any) => [String(s.id), s.title])
      );
      (ff || []).forEach((f: any) => {
        fieldsById[String(f.id)] = {
          field_label: f.label,
          section_title: fsMap.get(String(f.section_id)),
        };
      });
    }
  }

  // kelompokkan per section_title
  const map = new Map<string, ChecklistGroup>();
  for (const r of vals || []) {
    const meta = fieldsById[String(r.field_id)] || {};
    const section_title_raw = r.section_title || meta.section_title || "—";
    const section_title = toTitle(section_title_raw);
    const section_id = r.section_id || section_title || "sec";

    const point =
      r.field_label || meta.field_label || String(r.field_id || "—");

    const value =
      r.value_text != null && r.value_text !== ""
        ? String(r.value_text)
        : r.value_number != null
        ? String(r.value_number)
        : r.value_display != null
        ? String(r.value_display)
        : "—";

    if (!map.has(section_id)) {
      map.set(section_id, { section_id, section_title, items: [] });
    }
    map.get(section_id)!.items.push({ point, value });
  }

  return Array.from(map.values());
}

/* =========================
   4) HTML Template (2 kolom + pembatas per section, tanpa 'Keterangan')
========================= */
function htmlTemplate(recap: Recap, signatureBase64?: string | null) {
  const CSS = `
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;color:#0f172a;margin:0;padding:24px;font-size:12px;}
  .wrap{max-width:820px;margin:0 auto;}
  .header{display:flex;gap:16px;align-items:center;margin-bottom:16px;}
  .logo-box{width:110px;height:88px;border:1px solid #e2e8f0;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;line-height:1.2;text-align:center;}
  .head-right{flex:1;}
  .badge{background:#1d4ed8;color:#fff;font-weight:700;padding:4px 14px;border-radius:9999px;display:inline-block;font-size:11px;}
  .title-small{font-size:11px;color:#64748b;margin-bottom:4px;}
  .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px;font-size:11px;margin-top:10px;}
  .meta b{text-transform:capitalize;}
  .hr{border-bottom:1px solid #e2e8f0;margin:14px 0;}
  .section-title{font-weight:700;margin-bottom:6px;font-size:12px;text-transform:uppercase;}
  .table-title{background:#0f5ed7;color:#fff;font-weight:700;padding:6px 10px;border-radius:6px 6px 0 0;font-size:11px;margin-top:10px;}
  table{width:100%;border-collapse:collapse;}
  th,td{border:1px solid #dbeafe;padding:5px 6px;vertical-align:top;font-size:11px;}
  th{background:#eff6ff;font-weight:600;}
  .ttd-wrap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:26px;}
  .ttd-box{border:1px dashed #cbd5e1;border-radius:12px;height:110px;position:relative;}
  .sig{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;padding:6px;object-fit:contain;}
  @page{size:A4;margin:14mm 12mm;}
  `;

  const checklistHtml =
    recap.checklist && recap.checklist.length
      ? recap.checklist
          .map(
            (g) => `
            <div class="table-title">${dash(g.section_title)}</div>
            <table>
              <thead>
                <tr>
                  <th style="width:55%;">Point</th>
                  <th style="width:45%;">Pilihan / Nilai</th>
                </tr>
              </thead>
              <tbody>
                ${g.items
                  .map(
                    (r) => `<tr>
                      <td>${dash(r.point)}</td>
                      <td>${dash(r.value)}</td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="hr"></div>
          `
          )
          .join("")
      : `<div class="table-title">CHECKLIST AREA</div><div style="font-size:11px;">Tidak ada data.</div>`;

  const evalHtml =
    recap.evaluasi && recap.evaluasi.length
      ? `<div class="table-title">EVALUASI TIM</div>
        <table>
          <thead><tr><th>Nama</th><th>Hari</th><th>Aspek</th><th>Nilai</th><th>Keterangan</th></tr></thead>
          <tbody>
            ${recap.evaluasi
              .map(
                (r) => `<tr>
                  <td>${dash(r.nama)}</td>
                  <td>${dash(r.hari)}</td>
                  <td>${dash(r.aspek)}</td>
                  <td>${dash(r.nilai)}</td>
                  <td>${dash(r.catatan)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const targetHtml =
    recap.target && recap.target.length
      ? `<div class="table-title">TARGET & ACHIEVEMENT</div>
        <table>
          <thead><tr><th>Item</th><th>Target</th><th>Selesai</th><th>Keterangan</th></tr></thead>
          <tbody>
            ${recap.target
              .map(
                (r) => `<tr>
                  <td>${dash(r.item)}</td>
                  <td>${dash(r.target)}</td>
                  <td>${dash(r.selesai)}</td>
                  <td>${dash(r.keterangan)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const projectHtml =
    recap.project && recap.project.length
      ? `<div class="table-title">PROJECT TRACKING</div>
        <table>
          <thead><tr><th>Project</th><th>Deadline</th><th>%</th><th>Progress</th><th>Next Action</th><th>Risks</th></tr></thead>
          <tbody>
            ${recap.project
              .map(
                (p) => `<tr>
                  <td>${dash(p.title)}</td>
                  <td>${dash(p.deadline)}</td>
                  <td>${p.percentage == null ? "—" : p.percentage + "%"}</td>
                  <td>${dash(p.progress)}</td>
                  <td>${dash(p.next)}</td>
                  <td>${dash(p.risks)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const agendaHtml =
    recap.agenda && recap.agenda.length
      ? `<div class="table-title">AGENDA & JADWAL</div>
        <table>
          <thead><tr><th>Waktu</th><th>Kegiatan</th><th>Lokasi</th><th>PIC</th></tr></thead>
          <tbody>
            ${recap.agenda
              .map(
                (a) => `<tr>
                  <td>${dash(a.waktu)}</td>
                  <td>${dash(a.kegiatan)}</td>
                  <td>${dash(a.lokasi)}</td>
                  <td>${dash(a.pic)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const achHtml =
    recap.achievement && recap.achievement.length
      ? `<div class="table-title">ACHIEVEMENT</div>
        <table>
          <thead><tr><th>Judul</th><th>Uraian</th><th>Bukti</th></tr></thead>
          <tbody>
            ${recap.achievement
              .map(
                (a) => `<tr>
                  <td>${dash(a.judul)}</td>
                  <td>${dash(a.uraian)}</td>
                  <td>${dash(a.bukti)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>LEADER MONITORING ${dash(toTitle(recap.period))}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo-box">ASTRO<br/>GROUP</div>
      <div class="head-right">
        <div class="title-small">SITREP (SITUATION REPORT)</div>
        <div class="badge">LEADER MONITORING ${recap.period.toUpperCase()}</div>
        <div class="meta">
          <div>Tanggal: <b>${dash(recap.date)}</b></div>
          <div>Depo: <b>${dash(recap.depo)}</b></div>
          <div>Leader: <b>${dash(recap.leader)}</b></div>
          <div>Periode: <b>${dash(recap.period)}</b></div>
        </div>
      </div>
    </div>
    <div class="hr"></div>

    <div class="section-title">CHECKLIST AREA TANGGUNG JAWAB</div>
    ${checklistHtml}

    ${evalHtml}
    ${targetHtml}
    ${projectHtml}
    ${agendaHtml}
    ${achHtml}

    <div class="ttd-wrap">
      <div>
        <div style="font-size:11px;margin-bottom:4px;">Mengetahui,</div>
        <div class="ttd-box"></div>
        <div style="margin-top:4px;font-weight:600;font-size:11px;">Manager</div>
      </div>
      <div>
        <div style="font-size:11px;margin-bottom:4px;">Leader,</div>
        <div class="ttd-box">
          ${
            signatureBase64
              ? `<img class="sig" src="${signatureBase64}" />`
              : ""
          }
        </div>
        <div style="margin-top:4px;font-weight:600;font-size:11px;">${dash(
          recap.leader
        )}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* =========================
   5) Upload PDF
========================= */
async function uploadPdfAndGetUrl(
  name: string,
  buffer: Buffer | Uint8Array
): Promise<{ url: string; bucket: string; path: string }> {
  const supabase = getServiceSupabase();
  const bucket = "monitoring-pdf";
  const path = `daily/${name}`;
  const file = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  const up = await supabase.storage.from(bucket).upload(path, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (up.error) throw up.error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const url = data?.publicUrl || "";
  return { url, bucket, path };
}

/* =========================
   6) Handler
========================= */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      form_date: string;
      depo: string;
      leader: string;
      period?: "daily" | "weekly" | "monthly" | string;
      role_key?: string | null; // ✅ TAMBAH INI
      signature_base64?: string | null;

      evaluasi?: EvaluasiRow[];
      target?: TargetRow[];
      project?: ProjectRow[];
      agenda?: AgendaRow[];
      achievement?: AchRow[];
    };

    if (!body?.form_date || !body?.depo || !body?.leader) {
      return NextResponse.json(
        { error: "form_date/depo/leader kosong" },
        { status: 400 }
      );
    }

    const period = (body.period as any) ?? "daily";

    const role_key = (body.role_key ?? "").trim();

    // SELALU tarik checklist dari DB (grup per-section)
    const checklist = await buildChecklistFromDB({
      form_date: body.form_date,
      depo: body.depo,
      leader: body.leader,
      period,
      role_key: role_key || null, // ✅ TAMBAH INI
    });

    const recap: Recap = {
      date: body.form_date,
      depo: body.depo,
      leader: body.leader,
      period,
      checklist,
      evaluasi: body.evaluasi ?? [],
      target: body.target ?? [],
      project: body.project ?? [],
      agenda: body.agenda ?? [],
      achievement: body.achievement ?? [],
    };

    const html = htmlTemplate(recap, body.signature_base64);

    const exe = resolveBrowserExecutable();
    if (!exe) {
      throw new Error(
        "Chrome/Edge executable tidak ditemukan. Set PUPPETEER_EXECUTABLE_PATH atau install browser."
      );
    }

    const browser = await puppeteer.launch({
      executablePath: exe,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });

    await browser.close();

    const safeLeader = (recap.leader || "unknown").replace(/[^\w\-]+/g, "-");
    const safeDepo = (recap.depo || "depo").replace(/[^\w\-]+/g, "-");
    const safePeriod = (recap.period || "daily").toLowerCase();
    const fileName = `${recap.date}-${safePeriod}-${safeDepo}-${safeLeader}.pdf`;

    const { url } = await uploadPdfAndGetUrl(fileName, pdfBuffer);

    const supa = getServiceSupabase();
    await supa.from("monitoring_pdf_history").insert({
      date: recap.date,
      leader: recap.leader,
      depo: recap.depo,
      period: recap.period,
      url,
      filename: fileName,
    });

    return NextResponse.json({ url, filename: fileName });
  } catch (e: any) {
    console.error("FINALIZE ERROR:", e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

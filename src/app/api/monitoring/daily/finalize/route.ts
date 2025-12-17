// ==============================
// FILE: src/app/api/monitoring/daily/finalize/route.ts
// ==============================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { resolveBrowserExecutable } from "@/lib/chrome-path";
import { getServiceSupabase } from "@/lib/supabase/server";
import { readFile } from "fs/promises";
import path from "path";

/* =========================
   1) Types
========================= */
type ChecklistItem = { point: string; value: string };

type ChecklistGroup = {
  section_id: string;
  section_title: string;
  items: ChecklistItem[];
};

type PeriodKey = "daily" | "weekly" | "monthly" | "other";

type ChecklistByPeriod = {
  daily: ChecklistGroup[];
  weekly: ChecklistGroup[];
  monthly: ChecklistGroup[];
  other: ChecklistGroup[];
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
  role: string;
  role_key?: string | null;
  period: "daily" | "weekly" | "monthly" | string;
  checklistByPeriod: ChecklistByPeriod;
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

function normalizePeriod(p?: string | null): PeriodKey {
  const low = (p || "").trim().toLowerCase();
  if (low === "daily" || low === "harian") return "daily";
  if (low === "weekly" || low === "mingguan") return "weekly";
  if (low === "monthly" || low === "bulanan") return "monthly";
  return "other";
}

function periodLabelId(p: PeriodKey) {
  if (p === "daily") return "Harian";
  if (p === "weekly") return "Mingguan";
  if (p === "monthly") return "Bulanan";
  return "Lainnya";
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const p = path.join(process.cwd(), "public", "sitrep.jpg");
    const buf = await readFile(p);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// ======== Format Uang ========
const MONEY_LABEL_RE =
  /(saldo|kas|uang|nominal|harga|biaya|total|pendapatan|pengeluaran)/i;

function parseToNumberLike(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatIDR(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function maybeFormatMoney(pointLabel: string, raw: string, type?: string) {
  if (type === "currency" || MONEY_LABEL_RE.test(pointLabel)) {
    const num = parseToNumberLike(raw);
    if (num !== null) return formatIDR(num);
  }
  return raw;
}

function pickRawValue(r: any): string {
  const raw =
    r.value_display != null && String(r.value_display).trim() !== ""
      ? String(r.value_display)
      : r.value_text != null && String(r.value_text).trim() !== ""
      ? String(r.value_text)
      : r.value_number != null
      ? String(r.value_number)
      : "";
  return raw.trim() === "" ? "—" : raw;
}

function isKeteranganField(label: string, type?: string) {
  const l = (label || "").trim().toLowerCase();
  if (l === "keterangan") return true;
  if (l === "catatan" || l === "notes" || l === "note") return true;
  if (String(type || "").toLowerCase() === "text" && l.includes("ket"))
    return true;
  return false;
}

/* =========================
   3) Ambil checklist semua periode untuk 1 tanggal (ROLE-AWARE)
========================= */
async function buildChecklistFromDB(opts: {
  form_date: string;
  depo: string;
  leader?: string;
  role_key?: string | null;
}): Promise<ChecklistByPeriod> {
  const { form_date, depo, leader, role_key } = opts;
  const supa = getServiceSupabase();

  let query = supa
    .from("monitoring_checklist_values")
    .select(
      `
      id, section_id, field_id,
      section_title, field_label,
      value_text, value_number, value_display, type,
      form_date, depo, period, leader, role_key
    `
    )
    .eq("depo", depo)
    .eq("form_date", form_date);

  if (leader && leader.trim() !== "") query = query.eq("leader", leader.trim());

  // role-aware: kalau ada role_key, ambil itu; kalau tidak, ambil yang null (role default lama)
  if (role_key && role_key.trim() !== "")
    query = query.eq("role_key", role_key.trim());
  else query = query.is("role_key", null);

  query = query.order("id", { ascending: true });

  const { data: rows, error } = await query;
  if (error) throw error;

  const vals = (rows ?? []) as any[];

  const sectionIds = Array.from(
    new Set(vals.map((v) => String(v.section_id || "")).filter(Boolean))
  );
  const fieldIds = Array.from(
    new Set(vals.map((v) => String(v.field_id || "")).filter(Boolean))
  );

  const secIdx = new Map<string, number>();
  const secTitle = new Map<string, string>();
  const fldIdx = new Map<string, number>();
  const fldLabel = new Map<string, string>();

  async function loadMetaFromMonitoring() {
    if (sectionIds.length) {
      const { data: ms } = await supa
        .from("monitoring_sections")
        .select("id,title,idx")
        .in("id", sectionIds);
      (ms ?? []).forEach((s: any, i: number) => {
        secIdx.set(String(s.id), Number.isFinite(s.idx) ? Number(s.idx) : i);
        secTitle.set(String(s.id), s.title || "");
      });
    }
    if (fieldIds.length) {
      const { data: mf } = await supa
        .from("monitoring_fields")
        .select("id,label,idx")
        .in("id", fieldIds);
      (mf ?? []).forEach((f: any, i: number) => {
        fldIdx.set(String(f.id), Number.isFinite(f.idx) ? Number(f.idx) : i);
        fldLabel.set(String(f.id), f.label || "");
      });
    }
  }

  async function loadMetaFromFeature() {
    if (sectionIds.length) {
      const { data: fs } = await supa
        .from("feature_sections")
        .select("id,title,idx")
        .in("id", sectionIds);
      (fs ?? []).forEach((s: any, i: number) => {
        secIdx.set(String(s.id), Number.isFinite(s.idx) ? Number(s.idx) : i);
        secTitle.set(String(s.id), s.title || "");
      });
    }
    if (fieldIds.length) {
      const { data: ff } = await supa
        .from("feature_fields")
        .select("id,label,idx")
        .in("id", fieldIds);
      (ff ?? []).forEach((f: any, i: number) => {
        fldIdx.set(String(f.id), Number.isFinite(f.idx) ? Number(f.idx) : i);
        fldLabel.set(String(f.id), f.label || "");
      });
    }
  }

  try {
    await loadMetaFromMonitoring();
    if (secIdx.size === 0 && fldIdx.size === 0) await loadMetaFromFeature();
  } catch {
    await loadMetaFromFeature();
  }

  type Temp = {
    periodKey: PeriodKey;
    section_id: string;
    section_title: string;
    point: string;
    value: string;
    _pidx: number;
    _sidx: number;
    _fidx: number;
    _isKet: boolean;
    _hasValue: boolean;
  };

  const periodOrder: Record<PeriodKey, number> = {
    daily: 1,
    weekly: 2,
    monthly: 3,
    other: 4,
  };

  const temp: Temp[] = vals.map((r: any, i: number) => {
    const sid = String(r.section_id || `sec-${i}`);
    const fid = String(r.field_id || "");
    const pKey = normalizePeriod(r.period);

    const point =
      r.field_label ||
      (fid ? fldLabel.get(fid) || "" : "") ||
      (r.field_id ? String(r.field_id) : "—");

    const rawValue = pickRawValue(r);
    const value =
      rawValue === "—" ? rawValue : maybeFormatMoney(point, rawValue, r.type);

    const title =
      r.section_title ||
      (sid ? secTitle.get(sid) || "" : "") ||
      (sid ? sid : "—");

    const isKet = isKeteranganField(point, r.type);

    return {
      periodKey: pKey,
      section_id: sid,
      section_title: title || "Section",
      point,
      value,
      _pidx: periodOrder[pKey] ?? 99,
      _sidx: secIdx.has(sid) ? (secIdx.get(sid) as number) : 999999 + i,
      _fidx: fldIdx.has(fid) ? (fldIdx.get(fid) as number) : 999999 + i,
      _isKet: isKet,
      _hasValue: value !== "—",
    };
  });

  temp.sort((a, b) => {
    const p = a._pidx - b._pidx;
    if (p !== 0) return p;
    const s = a._sidx - b._sidx;
    if (s !== 0) return s;
    return a._fidx - b._fidx;
  });

  const out: ChecklistByPeriod = {
    daily: [],
    weekly: [],
    monthly: [],
    other: [],
  };

  const secMap = new Map<
    string,
    ChecklistGroup & { _p: PeriodKey; _sidx: number }
  >();

  for (const r of temp) {
    const key = `${r.periodKey}__${r.section_id}`;
    if (!secMap.has(key)) {
      secMap.set(key, {
        _p: r.periodKey,
        _sidx: r._sidx,
        section_id: r.section_id,
        section_title: r.section_title,
        items: [],
      });
    }
    secMap.get(key)!.items.push({ point: r.point, value: r.value });
  }

  const keysOrder: PeriodKey[] = ["daily", "weekly", "monthly", "other"];
  for (const pk of keysOrder) {
    const groups = Array.from(secMap.values())
      .filter((g) => g._p === pk)
      .sort((a, b) => a._sidx - b._sidx)
      .map(({ _p, _sidx, ...rest }) => rest);

    out[pk] = groups;
  }

  return out;
}

/* =========================
   4) HTML Template
========================= */
function isMonitoringPhotoUrl(value: string): boolean {
  if (!value) return false;
  if (/\/storage\/v1\/object\/public\/monitoring-photos\//.test(value))
    return true;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return true;
  return false;
}

function htmlTemplate(
  recap: Recap,
  signatureBase64?: string | null,
  logoBase64?: string | null
): string {
  const CSS = `
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;color:#0f172a;margin:0;padding:24px;font-size:12px;}
  .wrap{max-width:820px;margin:0 auto;}
  .header{display:flex;gap:16px;align-items:center;margin-bottom:16px;}
  .logo-box{width:110px;height:88px;border:1px solid #e2e8f0;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fff;}
  .logo{max-width:100%;max-height:100%;object-fit:contain;padding:8px;}
  .head-right{flex:1;}
  .badge{background:#1d4ed8;color:#fff;font-weight:800;padding:4px 14px;border-radius:9999px;display:inline-block;font-size:11px;}
  .title-small{font-size:11px;color:#000;font-weight:800;margin-bottom:4px;}
  .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px;font-size:11px;margin-top:10px;}
  .meta b{text-transform:capitalize;}
  .hr{border-bottom:1px solid #e2e8f0;margin:10px 0 16px;}
  .section-title{font-weight:800;margin:12px 0 4px;font-size:12px;text-transform:uppercase;}
  .sub-period{font-weight:700;margin:8px 0 4px;font-size:11px;color:#0f172a;}
  .table-title{background:#0f5ed7;color:#fff;font-weight:800;padding:6px 10px;border-radius:6px 6px 0 0;font-size:11px;margin-top:4px;}

  table.checklist{width:100%;border-collapse:collapse;table-layout:fixed;}
  table.checklist th, table.checklist td{border:1px solid #dbeafe;padding:6px 8px;vertical-align:top;font-size:11px;word-break:break-word;}
  table.checklist th{background:#eff6ff;font-weight:800;text-align:left;}

  td.value-cell{height:240px; padding:6px !important;}
  .img-wrap{width:100%;height:100%;}
  .img-proof{width:100%;height:100%;object-fit:cover;display:block;border:1px solid #c7d2fe;border-radius:10px;background:#f8fafc;}

  table.general{width:100%;border-collapse:collapse;table-layout:fixed;}
  table.general th, table.general td{border:1px solid #dbeafe;padding:5px 6px;vertical-align:top;font-size:11px;word-break:break-word;}
  table.general th{background:#eff6ff;font-weight:700;}

  .ttd-wrap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:26px;}
  .ttd-box{border:1px dashed #cbd5e1;border-radius:12px;height:110px;position:relative;}
  .sig{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;padding:6px;object-fit:contain;}

  @page{size:A4;margin:14mm 12mm;}
  `;

  const buildSectionRows = (items: ChecklistItem[]): string => {
    let html = "";
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const isPhoto = isMonitoringPhotoUrl(it.value);

      const valueHtml = isPhoto
        ? `<div class="img-wrap"><img src="${it.value}" class="img-proof" alt="foto" /></div>`
        : dash(it.value);

      const tdValue = isPhoto
        ? `<td class="value-cell">${valueHtml}</td>`
        : `<td>${valueHtml}</td>`;

      html += `
        <tr>
          <td>${dash(it.point)}</td>
          ${tdValue}
        </tr>
      `;
    }
    return html;
  };

  const renderChecklistForPeriod = (periodKey: PeriodKey): string => {
    const groups = recap.checklistByPeriod[periodKey];
    if (!groups || groups.length === 0) return "";

    const label = periodLabelId(periodKey);
    return `
      <div class="sub-period">Checklist ${label}</div>
      ${groups
        .map(
          (g) => `
        <div class="table-title">${dash(g.section_title)}</div>
        <table class="checklist">
          <colgroup>
            <col style="width:30%;" />
            <col style="width:70%;" />
          </colgroup>
          <thead>
            <tr>
              <th>Point</th>
              <th>Pilihan / Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${buildSectionRows(g.items)}
          </tbody>
        </table>
        <div class="hr"></div>
      `
        )
        .join("")}
    `;
  };

  const checklistHtml =
    renderChecklistForPeriod("daily") +
    renderChecklistForPeriod("weekly") +
    renderChecklistForPeriod("monthly") +
    renderChecklistForPeriod("other");

  const evalHtml =
    recap.evaluasi && recap.evaluasi.length
      ? `<div class="section-title">EVALUASI TIM</div>
         <div class="table-title">Evaluasi Tim</div>
        <table class="general">
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
      ? `<div class="section-title">TARGET & ACHIEVEMENT</div>
         <div class="table-title">Target & Achievement</div>
        <table class="general">
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
      ? `<div class="section-title">PROJECT TRACKING</div>
         <div class="table-title">Project Tracking</div>
        <table class="general">
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
      ? `<div class="section-title">AGENDA & JADWAL</div>
         <div class="table-title">Agenda & Jadwal</div>
        <table class="general">
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
      ? `<div class="section-title">ACHIEVEMENT</div>
         <div class="table-title">Achievement</div>
        <table class="general">
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
  <title>LEADER MONITORING DAILY</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo-box">
        ${
          logoBase64
            ? `<img class="logo" src="${logoBase64}" alt="Logo" />`
            : `ASTRO<br/>GROUP`
        }
      </div>
      <div class="head-right">
        <div class="title-small">SITREP (SITUATION REPORT)</div>
        <div class="badge">LEADER MONITORING DAILY</div>
        <div class="meta">
          <div>Tanggal: <b>${dash(recap.date)}</b></div>
          <div>Depo: <b>${dash(recap.depo)}</b></div>
          <div>Leader: <b>${dash(recap.leader)}</b></div>
          <div>Role: <b>${dash(recap.role)}</b></div>
        </div>
      </div>
    </div>
    <div class="hr"></div>

    <div class="section-title">CHECKLIST AREA TANGGUNG JAWAB</div>
    <div style="font-size:10px;color:#64748b;margin-bottom:4px;">
      Harian: ${recap.checklistByPeriod.daily.length} section,
      Mingguan: ${recap.checklistByPeriod.weekly.length} section,
      Bulanan: ${recap.checklistByPeriod.monthly.length} section,
      Lainnya: ${recap.checklistByPeriod.other.length} section
    </div>
    ${
      checklistHtml ||
      "<div style='font-size:11px;'>Tidak ada data checklist.</div>"
    }

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
   5) Upload PDF ke Supabase
========================= */
async function uploadPdfAndGetUrl(
  name: string,
  buffer: Buffer | Uint8Array
): Promise<{ url: string; bucket: string; path: string }> {
  const supabase = getServiceSupabase();
  const bucket = "monitoring-pdf";
  const pathFile = `daily/${name}`;
  const file = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  const up = await supabase.storage.from(bucket).upload(pathFile, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (up.error) throw up.error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(pathFile);
  const url = data?.publicUrl || "";
  return { url, bucket, path: pathFile };
}

/* =========================
   6) PUSH ke Google Spreadsheet (via Google Apps Script Web App)
   - pakai env: APPSCRIPT_CHECKLIST_SHEET_URL
   - AppScript kamu expect: { sheet: string, rows: [{date,depo,leader,role,period,section,point,value}] }
========================= */
type SheetRow = {
  date: string;
  depo: string;
  leader: string;
  role: string;
  period: string; // "daily" | "weekly" | "monthly"
  section: string;
  point: string;
  value: string;
};

function flattenChecklistToSheetRows(recap: Recap): SheetRow[] {
  const rows: SheetRow[] = [];
  const role = recap.role_key || recap.role || "-";

  const pushPeriod = (p: keyof ChecklistByPeriod, period: string) => {
    const groups = recap.checklistByPeriod[p] || [];
    for (const g of groups) {
      const sectionTitle = (g.section_title || "").trim() || "—";
      for (const it of g.items || []) {
        if (!it.value || it.value === "—") continue; // optional: skip kosong
        rows.push({
          date: recap.date,
          depo: recap.depo,
          leader: recap.leader,
          role,
          period,
          section: sectionTitle,
          point: it.point ?? "—",
          value: it.value ?? "—",
        });
      }
    }
  };

  pushPeriod("daily", "daily");
  pushPeriod("weekly", "weekly");
  pushPeriod("monthly", "monthly");
  // "other" tidak dikirim ke sheet (kalau mau, tinggal aktifkan)
  // pushPeriod("other", "other");

  return rows;
}

function toTitleRole(role: string) {
  const s = (role || "-").replace(/_/g, " ").trim();
  // kapital tiap kata
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function sheetNameFor(period: "daily" | "weekly" | "monthly", role: string) {
  const p =
    period === "daily"
      ? "Harian"
      : period === "weekly"
      ? "Mingguan"
      : "Bulanan";
  return `${p} - ${toTitleRole(role)}`;
}

async function pushRowsToSpreadsheet(payload: {
  sheet: string;
  rows: SheetRow[];
}) {
  const url = process.env.APPSCRIPT_CHECKLIST_SHEET_URL;
  if (!url) {
    throw new Error(
      "APPSCRIPT_CHECKLIST_SHEET_URL belum di-set di .env (URL Web App Google Apps Script)."
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Gagal push ke Spreadsheet. HTTP ${res.status}. ${text}`);
  }
  return text;
}

/* =========================
   7) Handler
========================= */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      form_date: string;
      depo: string;
      leader: string;
      role?: string;
      role_key?: string | null;
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

    const checklistByPeriod = await buildChecklistFromDB({
      form_date: body.form_date,
      depo: body.depo,
      leader: body.leader,
      role_key: body.role_key ?? null,
    });

    const recap: Recap = {
      date: body.form_date,
      depo: body.depo,
      leader: body.leader,
      role: body.role || body.role_key || "-",
      role_key: body.role_key ?? null,
      period: "daily",
      checklistByPeriod,
      evaluasi: body.evaluasi ?? [],
      target: body.target ?? [],
      project: body.project ?? [],
      agenda: body.agenda ?? [],
      achievement: body.achievement ?? [],
    };

    // ====== PDF
    const logoBase64 = await loadLogoBase64();
    const html = htmlTemplate(recap, body.signature_base64, logoBase64);

    const exe = resolveBrowserExecutable();
    if (!exe)
      throw new Error(
        "Chrome/Edge executable tidak ditemukan. Set PUPPETEER_EXECUTABLE_PATH atau install browser."
      );

    const browser = await puppeteer.launch({
      executablePath: exe,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // tunggu semua gambar load
    await page.evaluate(async () => {
      const imgs = Array.from(document.images || []);
      await Promise.all(
        imgs.map((img) => {
          // @ts-ignore
          if (img.complete) return Promise.resolve(true);
          return new Promise((res) => {
            img.addEventListener("load", () => res(true));
            img.addEventListener("error", () => res(true));
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });

    await browser.close();

    const ts = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    const safeLeader = (recap.leader || "unknown").replace(/[^\w\-]+/g, "-");
    const safeDepo = (recap.depo || "depo").replace(/[^\w\-]+/g, "-");
    const fileName = `${recap.date}-daily-${safeDepo}-${safeLeader}-${ts}.pdf`;

    const { url } = await uploadPdfAndGetUrl(fileName, pdfBuffer);

    const supa = getServiceSupabase();
    await supa.from("monitoring_pdf_history").insert({
      date: recap.date,
      leader: recap.leader,
      depo: recap.depo,
      period: recap.period,
      url,
      filename: fileName,
      role_key: recap.role_key ?? null,
    } as any);

    // ====== PUSH Spreadsheet (per period + role)
    const roleStr = recap.role_key || recap.role || "-";
    const rowsAll = flattenChecklistToSheetRows(recap);

    const rowsDaily = rowsAll.filter((r) => r.period === "daily");
    const rowsWeekly = rowsAll.filter((r) => r.period === "weekly");
    const rowsMonthly = rowsAll.filter((r) => r.period === "monthly");

    const sheet_results: any[] = [];

    try {
      if (rowsDaily.length) {
        sheet_results.push(
          await pushRowsToSpreadsheet({
            sheet: sheetNameFor("daily", roleStr),
            rows: rowsDaily,
          })
        );
      }
      if (rowsWeekly.length) {
        sheet_results.push(
          await pushRowsToSpreadsheet({
            sheet: sheetNameFor("weekly", roleStr),
            rows: rowsWeekly,
          })
        );
      }
      if (rowsMonthly.length) {
        sheet_results.push(
          await pushRowsToSpreadsheet({
            sheet: sheetNameFor("monthly", roleStr),
            rows: rowsMonthly,
          })
        );
      }
    } catch (err: any) {
      // Spreadsheet gagal tidak menggagalkan PDF
      console.error("SPREADSHEET PUSH ERROR:", err);
      sheet_results.push({ ok: false, error: String(err?.message || err) });
    }

    return NextResponse.json({
      url,
      filename: fileName,
      sheet: sheet_results,
      sheet_rows: {
        total: rowsAll.length,
        daily: rowsDaily.length,
        weekly: rowsWeekly.length,
        monthly: rowsMonthly.length,
      },
    });
  } catch (e: any) {
    console.error("FINALIZE ERROR:", e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

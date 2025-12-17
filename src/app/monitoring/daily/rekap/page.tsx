// ================================
// FILE: app/monitoring/daily/rekap-ttd/page.tsx
// ================================
"use client";

import { useEffect, useRef, useState } from "react";

/* ================= SignatureBox (Pointer Events + HiDPI + Undo) ================= */
function SignatureBox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const height = 140;
  const bg = "#ffffff";
  const pen = "#111827";

  // Stack untuk fitur Undo
  const stack = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Setup & resize HiDPI
  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapperRef.current;
    if (!cvs || !wrap) return;

    const resize = () => {
      const w = Math.max(360, Math.min(wrap.clientWidth, 720));
      const h = height;
      const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));

      // Set ukuran pixel + CSS size
      cvs.width = w * ratio;
      cvs.height = h * ratio;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;

      const ctx = cvs.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);

      // Background + border dashed
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#CBD5E1";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
      ctx.setLineDash([]);

      // Reset stack (biar tidak restore ukuran lama)
      stack.current = [];
      onChange(null);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [height, onChange]);

  // Util
  const getPoint = (e: PointerEvent) => {
    const cvs = canvasRef.current!;
    const rect = cvs.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushSnapshot = () => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const data = ctx.getImageData(0, 0, cvs.width, cvs.height);
    stack.current.push(data);
  };

  const restoreSnapshot = () => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const lastSnap = stack.current.pop();
    if (!lastSnap) return;
    ctx.putImageData(lastSnap, 0, 0);
    // update value
    try {
      const url = cvs.toDataURL("image/png");
      onChange(url);
    } catch {
      onChange(null);
    }
  };

  // Pointer handlers (one codepath for mouse & touch)
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const handleDown = (e: PointerEvent) => {
      // biar canvas menangani scroll/touch
      cvs.setPointerCapture(e.pointerId);
      drawing.current = true;
      last.current = getPoint(e);

      // snapshot sebelum mulai coret (untuk Undo)
      pushSnapshot();
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      const p = getPoint(e);
      const l = last.current;
      if (!p || !l) return;

      ctx.lineWidth = 2.2; // sudah diskalakan via setTransform di resize
      ctx.lineCap = "round";
      ctx.strokeStyle = pen;

      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
    };
    const handleUp = (e: PointerEvent) => {
      drawing.current = false;
      last.current = null;
      cvs.releasePointerCapture?.(e.pointerId);
      try {
        const url = cvs.toDataURL("image/png");
        onChange(url);
      } catch {
        onChange(null);
      }
    };
    const handleLeave = () => {
      drawing.current = false;
      last.current = null;
    };

    cvs.addEventListener("pointerdown", handleDown);
    cvs.addEventListener("pointermove", handleMove);
    cvs.addEventListener("pointerup", handleUp);
    cvs.addEventListener("pointercancel", handleLeave);
    cvs.addEventListener("pointerleave", handleLeave);

    return () => {
      cvs.removeEventListener("pointerdown", handleDown);
      cvs.removeEventListener("pointermove", handleMove);
      cvs.removeEventListener("pointerup", handleUp);
      cvs.removeEventListener("pointercancel", handleLeave);
      cvs.removeEventListener("pointerleave", handleLeave);
    };
  }, [onChange]);

  const handleClear = () => {
    const cvs = canvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return;

    // redraw background + border dengan ukuran CSS saat ini
    const w = parseInt(cvs.style.width || "0", 10);
    const h = parseInt(cvs.style.height || "0", 10);
    const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#CBD5E1";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    ctx.setLineDash([]);

    stack.current = [];
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={wrapperRef}
        className="rounded-xl border border-slate-200 bg-white p-3"
        style={{ touchAction: "none" }}
      >
        <canvas ref={canvasRef} className="h-full w-full rounded-xl" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          Tanda tangan pada kotak di atas.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={restoreSnapshot}
            disabled={stack.current.length === 0}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Bersihkan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Types & endpoints ================= */
export type ChecklistPrintRow = { point: string; value: string; note?: string };
export type EvaluasiRow = {
  nama: string;
  hari: string;
  aspek: string;
  nilai?: string;
  catatan?: string;
};
export type TargetRow = {
  item: string;
  target?: string;
  selesai?: string;
  keterangan?: string;
};
export type ProjectRow = {
  title: string;
  deadline?: string | null;
  percentage?: number;
  progress?: string;
  next?: string;
  risks?: string;
};
export type AgendaRow = {
  waktu: string;
  kegiatan: string;
  lokasi?: string;
  pic?: string;
};
export type AchRow = { judul: string; uraian?: string; bukti?: string };
export type HistoryItem = {
  date: string;
  url: string;
  leader: string;
  depo: string;
};

const EVAL_API = "/api/monitoring/daily/evaluasi/recap";
const TARGET_API = "/api/monitoring/daily/target/recap";
const PROJECT_API = "/api/monitoring/daily/project-tracking/recap";
const AGENDA_API = "/api/monitoring/daily/agenda/recap";
const ACH_API = "/api/monitoring/daily/achievement/recap";

/* ================= Helpers ================= */
const dash = (s?: string | number | null) =>
  s === undefined || s === null || String(s).trim() === "" ? "—" : String(s);
const dateISO = (d = new Date()) => new Date(d).toISOString().slice(0, 10);

// Title Case unicode-safe
const toTitle = (s = "") =>
  s.toLowerCase().replace(/\b\p{L}/gu, (m) => m.toUpperCase());

async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null as any;
    return (await r.json()) as T;
  } catch {
    return null as any;
  }
}

/* === Helper: ambil forms dgn fallback leader & depo === */
async function fetchForms(date: string, depo: string, leader?: string) {
  type FormsResp = {
    form?: { leader?: string; depo?: string; date?: string } | null;
    values?: Array<{
      section_id: string;
      field_id: string;
      value_text: string | null;
      value_number: number | null;
    }>;
  } | null;

  if (leader && leader.trim()) {
    const q1 = new URLSearchParams({ date, depo, leader }).toString();
    const r1 = await safeFetchJson<FormsResp>(
      `/api/monitoring/daily/forms?${q1}`
    );
    if (r1?.values && r1.values.length) return r1;
  }

  if (depo && depo.trim()) {
    const q2 = new URLSearchParams({ date, depo }).toString();
    const r2 = await safeFetchJson<FormsResp>(
      `/api/monitoring/daily/forms?${q2}`
    );
    if (r2?.values && r2.values.length) return r2;
  }

  const q3 = new URLSearchParams({ date }).toString();
  const r3 = await safeFetchJson<FormsResp>(
    `/api/monitoring/daily/forms?${q3}`
  );
  if (r3?.values && r3.values.length) return r3;

  return { form: null, values: [] };
}

// ====== dipakai untuk rekap checklist (pakai /api/monitoring/daily/recap) ======
async function buildChecklistRows(
  date: string,
  depo: string,
  leader: string,
  role = "kepala_admin"
) {
  const qs = new URLSearchParams({ date, depo, leader, role }).toString();
  const r = await fetch(`/api/monitoring/daily/recap?${qs}`, {
    cache: "no-store",
  });
  if (!r.ok) {
    return { rows: [], leaderFromDB: "" };
  }
  const j = await r.json();

  // ✅ di backend sekarang bentuknya {sections:[{title, rows: [...] }]}
  const sections = Array.isArray(j.sections) ? j.sections : [];

  const out: ChecklistPrintRow[] = [];

  for (const sec of sections) {
    const secTitle = sec.title ?? "Tanpa Judul";

    // kelompokkan per group_key
    const groups: Record<
      string,
      {
        sectionTitle: string;
        groupLabel: string;
        fields: any[];
      }
    > = {};

    const secRows = Array.isArray(sec.rows) ? sec.rows : [];

    for (const f of secRows) {
      const gkey = f.group_key || f.label || "default";
      if (!groups[gkey]) {
        groups[gkey] = {
          sectionTitle: secTitle,
          groupLabel: f.group_label || f.label || secTitle,
          fields: [],
        };
      }
      groups[gkey].fields.push(f);
    }

    // sekarang bentukkan baris rekap per group
    for (const gkey of Object.keys(groups)) {
      const g = groups[gkey];

      let value = "—";
      let note: string | undefined;

      for (const f of g.fields) {
        const isKeterangan =
          f.label === "Keterangan" || f.group_order === 90 || f.type === "text";

        // kalau keterangan: taruh di note
        if (isKeterangan) {
          if (f.value && String(f.value).trim() !== "") {
            note = String(f.value);
          }
          continue;
        }

        // selain keterangan → jadikan nilai
        if (f.value !== null && f.value !== undefined && f.value !== "") {
          if (f.type === "currency") {
            // sedikit formatting
            const num = Number(f.value);
            value = Number.isFinite(num)
              ? "Rp" + num.toLocaleString("id-ID")
              : String(f.value);
          } else {
            value = String(f.value);
          }
        }
      }

      out.push({
        point: `${g.sectionTitle} - ${g.groupLabel}`,
        value: value,
        note: note && note.trim() !== "" ? note : "—",
      });
    }
  }

  return {
    rows: out,
    leaderFromDB: j.leader ?? "",
  };
}

async function buildOtherTabs(date: string, depo: string, leader: string) {
  const qs = new URLSearchParams({
    date,
    depo: depo ?? "",
    leader: leader ?? "",
  }).toString();
  const [ev, tg, pj, ag, ac] = await Promise.all([
    safeFetchJson<any>(`${EVAL_API}?${qs}`),
    safeFetchJson<any>(`${TARGET_API}?${qs}`),
    safeFetchJson<any>(`${PROJECT_API}?${qs}`),
    safeFetchJson<any>(`${AGENDA_API}?${qs}`),
    safeFetchJson<any>(`${ACH_API}?${qs}`),
  ]);
  return {
    evaluasi: ev?.rows ?? [],
    target: tg?.rows ?? [],
    project: pj?.rows ?? [],
    agenda: ag?.rows ?? [],
    achievement: ac?.rows ?? [],
  };
}

/* ====== Snapshot gabungan untuk 1 hari ====== */
async function buildRecapSnapshot(
  date: string,
  depo: string,
  leader: string,
  role = "kepala_admin"
) {
  const { rows: checklist, leaderFromDB } = await buildChecklistRows(
    date,
    depo,
    leader,
    role
  );
  const leaderFinal = leader?.trim() ? leader : leaderFromDB || leader;
  const others = await buildOtherTabs(date, depo, leaderFinal);
  return { date, depo, leader: leaderFinal, checklist, ...others };
}

// ====== label role untuk tampilan ======
const ROLE_LABEL: Record<string, string> = {
  kepala_admin: "Kepala Admin",
  kepala_gudang: "Kepala Gudang",
  spv: "SPV",
  sales_manager: "Sales Manager",
  bsdc: "BSDC",
  hrd: "HRD",
  direktur: "Direktur",
  it: "IT",
};

/* ================= Page ================= */
export default function RekapTTD() {
  const [date, setDate] = useState<string>(() => dateISO());
  const [leader, setLeader] = useState("");
  const [depo, setDepo] = useState("");
  const [role, setRole] = useState("kepala_admin"); // slug role: kepala_admin, kepala_gudang, dst

  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [checklistRows, setChecklistRows] = useState<ChecklistPrintRow[]>([]);
  const [evalRows, setEvalRows] = useState<EvaluasiRow[]>([]);
  const [targetRows, setTargetRows] = useState<TargetRow[]>([]);
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([]);
  const [agendaRows, setAgendaRows] = useState<AgendaRow[]>([]);
  const [achRows, setAchRows] = useState<AchRow[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filterFrom, setFilterFrom] = useState<string>(() =>
    dateISO(new Date(Date.now() - 6 * 24 * 3600 * 1000))
  );
  const [filterTo, setFilterTo] = useState<string>(() => dateISO());

  // label yang ditampilkan di input Role
  const roleLabel = ROLE_LABEL[role] ?? role ?? "-";

  // ====== Auto-isi dari whoami (Leader, Depo, Role) ======
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/whoami", { cache: "no-store" });
        const j = await r.json().catch(() => null);

        const nameRaw: string =
          j?.profile?.full_name ||
          (j?.user?.email ? String(j.user.email).split("@")[0] : "") ||
          "";

        // sesuaikan field role di profile kamu (role_key / role / dll)
        const roleFromProfile: string =
          j?.profile?.role_key || j?.profile?.role || "kepala_admin";

        if (!leader && nameRaw) setLeader(toTitle(nameRaw));
        if (!depo) setDepo(toTitle("Tulungagung"));
        setRole(roleFromProfile);
      } catch {
        if (!depo) setDepo(toTitle("Tulungagung"));
        setRole("kepala_admin");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    try {
      const s = await buildRecapSnapshot(date, depo, leader, role);
      setChecklistRows(s.checklist ?? []);
      setEvalRows(s.evaluasi ?? []);
      setTargetRows(s.target ?? []);
      setProjectRows(s.project ?? []);
      setAgendaRows(s.agenda ?? []);
      setAchRows(s.achievement ?? []);
      if (!leader && s.leader) setLeader(toTitle(s.leader));
    } catch {
      setChecklistRows([]);
      setEvalRows([]);
      setTargetRows([]);
      setProjectRows([]);
      setAgendaRows([]);
      setAchRows([]);
    }
  }
  useEffect(() => {
    refreshAll(); // eslint-disable-line
  }, [date, depo, leader, role]);

  async function refreshHistory() {
    const qs = new URLSearchParams({
      leader,
      depo,
      from: filterFrom,
      to: filterTo,
    });
    const r = await fetch(`/api/monitoring/daily/history?${qs}`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    if (j?.items) setHistory(j.items as HistoryItem[]);
  }
  useEffect(() => {
    refreshHistory(); // eslint-disable-line
  }, [leader, depo, filterFrom, filterTo]);

  async function printLocal() {
    const s = await buildRecapSnapshot(date, depo, leader, role);
    setChecklistRows(s.checklist);
    setEvalRows(s.evaluasi);
    setTargetRows(s.target);
    setProjectRows(s.project);
    setAgendaRows(s.agenda);
    setAchRows(s.achievement);
    requestAnimationFrame(() => window.print());
  }

  async function finalizeAll() {
    if (!signature) {
      alert("Tanda tangan belum diisi.");
      return;
    }
    setBusy(true);
    try {
      const snap = await buildRecapSnapshot(date, depo, leader, role);
      setChecklistRows(snap.checklist);
      setEvalRows(snap.evaluasi);
      setTargetRows(snap.target);
      setProjectRows(snap.project);
      setAgendaRows(snap.agenda);
      setAchRows(snap.achievement);

      const res = await fetch("/api/monitoring/daily/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_date: snap.date,
          leader: snap.leader,
          depo: snap.depo,
          signature_base64: signature,
          role_key: role, // ✅ INI WAJIB

          // ✅ KIRIM SEMUA TAB
          evaluasi: snap.evaluasi ?? [],
          target: snap.target ?? [],
          project: snap.project ?? [],
          agenda: snap.agenda ?? [],
          achievement: snap.achievement ?? [],
        }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        alert(j?.error || "Gagal mem-finalisasi");
        return;
      }

      const a = document.createElement("a");
      a.href = j.url;
      if (j.filename) a.download = j.filename;
      a.rel = "noopener";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setSignature(null);
      refreshHistory();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 input-black">
      {/* Panel kontrol */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm no-print">
        <div className="mb-2 text-lg font-semibold text-slate-800">
          Rekap & Tanda Tangan
        </div>
        <p className="text-sm text-slate-600">
          Sistem merekap <b>Checklist Area</b>, <b>Evaluasi Tim</b>,{" "}
          <b>Target &amp; Achievement</b>, <b>Project Tracking</b>,{" "}
          <b>Agenda &amp; Jadwal</b>, dan <b>Achievement</b> dari data yang
          sudah <b>disimpan</b>.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs text-slate-600">Tanggal</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-black"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Leader</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-black"
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              onBlur={(e) => setLeader(toTitle(e.target.value))}
              placeholder="Nama leader"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Depo</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-black"
              value={depo}
              onChange={(e) => setDepo(e.target.value)}
              onBlur={(e) => setDepo(toTitle(e.target.value))}
              placeholder="Nama depo"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Role</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-black bg-slate-100"
              value={roleLabel}
              readOnly
            />
          </div>
        </div>

        <div className="mt-4">
          <SignatureBox value={signature} onChange={setSignature} />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            onClick={refreshAll}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Muat Ulang Data Rekap
          </button>
          <button
            onClick={printLocal}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cetak PDF (Lokal)
          </button>
          <button
            onClick={finalizeAll}
            disabled={busy}
            aria-busy={busy ? true : undefined}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Memproses…" : "Simpan & Buat PDF (Final)"}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm no-print">
        <div className="mb-2 text-sm font-semibold text-slate-800">
          Riwayat PDF
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs text-slate-600">Rentang:</span>
          <input
            type="date"
            className="rounded-xl border px-3 py-1.5 text-sm"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <span className="text-xs text-slate-600">s.d.</span>
          <input
            type="date"
            className="rounded-xl border px-3 py-1.5 text-sm"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
          <button
            onClick={refreshHistory}
            className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Muat Ulang
          </button>
        </div>
        {history.length ? (
          <ul className="space-y-2 text-sm">
            {history.map((h, i) => (
              <li
                key={`${h.date}-${i}`}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-slate-700">{h.date}</span>
                  <span className="text-xs text-slate-500">
                    {h.leader} — {h.depo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    href={h.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buka
                  </a>
                  <a
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    href={h.url}
                    download
                  >
                    Unduh
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-500">Belum ada riwayat.</div>
        )}
      </div>

      {/* PRINT VIEW */}
      <div id="print-area" className="hidden print:block">
        {/* Header */}
        <div className="mb-4 rounded-2xl p-5" style={{ background: "#60A5FA" }}>
          <div className="text-xl font-bold text-black">
            LEADER MONITORING DAILY
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-black md:grid-cols-3">
            <div>
              <span className="text-black">Tanggal:</span>{" "}
              <span className="font-semibold text-black">{dash(date)}</span>
            </div>
            <div>
              <span className="text-black">Leader:</span>{" "}
              <span className="font-semibold text-black">{dash(leader)}</span>
            </div>
            <div>
              <span className="text-black">Depo:</span>{" "}
              <span className="font-semibold text-black">{dash(depo)}</span>
            </div>
          </div>
        </div>

        <SectionPrint title="Checklist Area">
          <Table3
            headA="Point"
            headB="Pilihan / Nilai"
            headC="Keterangan"
            rows={
              checklistRows.length
                ? checklistRows
                : [{ point: "Checklist", value: "—", note: "—" }]
            }
            wideC
          />
        </SectionPrint>

        <SectionPrint title="Evaluasi Tim">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <Th>Nama</Th>
                <Th>Hari</Th>
                <Th>Aspek</Th>
                <Th>Nilai</Th>
                <Th width={320}>Catatan</Th>
              </tr>
            </thead>
            <tbody>
              {(evalRows.length
                ? evalRows
                : [
                    {
                      nama: "—",
                      hari: "—",
                      aspek: "—",
                      nilai: "—",
                      catatan: "—",
                    },
                  ]
              ).map((r, i) => (
                <tr key={i} className="align-top">
                  <Td>{dash(r.nama)}</Td>
                  <Td>{dash(r.hari)}</Td>
                  <Td>{dash(r.aspek)}</Td>
                  <Td>{dash(r.nilai)}</Td>
                  <Td>{dash(r.catatan)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPrint>

        <SectionPrint title="Target & Achievement">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <Th>Item</Th>
                <Th>Target</Th>
                <Th>Selesai</Th>
                <Th width={320}>Keterangan</Th>
              </tr>
            </thead>
            <tbody>
              {(targetRows.length
                ? targetRows
                : [{ item: "—", target: "—", selesai: "—", keterangan: "—" }]
              ).map((r, i) => (
                <tr key={i} className="align-top">
                  <Td>{dash(r.item)}</Td>
                  <Td>{dash(r.target)}</Td>
                  <Td>{dash(r.selesai)}</Td>
                  <Td>{dash(r.keterangan)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPrint>

        <SectionPrint title="Project Tracking">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <Th>Project</Th>
                <Th>Deadline</Th>
                <Th>%</Th>
                <Th width={280}>Progress</Th>
                <Th width={280}>Next Action</Th>
                <Th width={240}>Risks</Th>
              </tr>
            </thead>
            <tbody>
              {(projectRows.length ? projectRows : [{ title: "—" }]).map(
                (p, i) => (
                  <tr key={i} className="align-top">
                    <Td>{dash(p.title)}</Td>
                    <Td>{dash(p.deadline)}</Td>
                    <Td>{p.percentage == null ? "—" : `${p.percentage}%`}</Td>
                    <Td>{dash(p.progress)}</Td>
                    <Td>{dash(p.next)}</Td>
                    <Td>{dash(p.risks)}</Td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </SectionPrint>

        <SectionPrint title="Agenda & Jadwal">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <Th>Waktu</Th>
                <Th>Kegiatan</Th>
                <Th>Lokasi</Th>
                <Th>PIC</Th>
              </tr>
            </thead>
            <tbody>
              {(agendaRows.length
                ? agendaRows
                : [{ waktu: "—", kegiatan: "—", lokasi: "—", pic: "—" }]
              ).map((a, i) => (
                <tr key={i} className="align-top">
                  <Td>{dash(a.waktu)}</Td>
                  <Td>{dash(a.kegiatan)}</Td>
                  <Td>{dash(a.lokasi)}</Td>
                  <Td>{dash(a.pic)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPrint>

        <SectionPrint title="Achievement">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <Th>Judul</Th>
                <Th width={420}>Uraian</Th>
                <Th>Bukti</Th>
              </tr>
            </thead>
            <tbody>
              {(achRows.length
                ? achRows
                : [{ judul: "—", uraian: "—", bukti: "—" }]
              ).map((a, i) => (
                <tr key={i} className="align-top">
                  <Td>{dash(a.judul)}</Td>
                  <Td>{dash(a.uraian)}</Td>
                  <Td>{dash(a.bukti)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionPrint>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm">Mengetahui,</div>
            <div className="mt-2 h-28 rounded-xl border border-dashed border-slate-300"></div>
            <div className="mt-1 text-sm font-medium">Manager</div>
          </div>
          <div>
            <div className="text-sm">Leader,</div>
            <div className="relative mt-2 h-28 overflow-hidden rounded-xl border border-dashed border-slate-300">
              {signature && (
                <img
                  src={signature}
                  alt="ttd"
                  className="absolute inset-0 m-auto object-contain p-1"
                  style={{ maxHeight: "100%", maxWidth: "100%" }}
                />
              )}
            </div>
            <div className="mt-1 text-sm font-medium">{dash(leader)}</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input-black input,
        .input-black select,
        .input-black textarea {
          color: #000;
        }
        .input-black input::placeholder {
          color: #000;
          opacity: 0.6;
        }
        .print\\:block {
          display: none;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          html,
          body {
            background: #fff !important;
          }
          @page {
            size: A4 portrait;
            margin: 14mm 12mm;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}

/* ============ komponen kecil untuk print ============ */
function SectionPrint({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 text-base font-bold text-slate-800">{title}</div>
      {children}
    </section>
  );
}
function Th({
  children,
  width,
}: {
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <th
      className="border border-slate-300 px-3 py-2 text-sm"
      style={width ? { width } : undefined}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="border border-slate-300 px-3 py-2 text-sm">{children}</td>
  );
}
function Table3({
  headA = "Point",
  headB = "Nilai",
  headC = "Keterangan",
  rows,
  wideC = false,
}: {
  headA?: string;
  headB?: string;
  headC?: string;
  rows: ChecklistPrintRow[];
  wideC?: boolean;
}) {
  const safe = rows.length ? rows : [{ point: "—", value: "—", note: "—" }];
  const styleA = wideC ? { width: "45%" } : undefined;
  const styleB = wideC ? { width: "15%" } : undefined;
  const styleC = wideC ? { width: "40%" } : undefined;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left">
          <th
            className="border border-slate-300 px-3 py-2 text-sm"
            style={styleA}
          >
            {headA}
          </th>
          <th
            className="border border-slate-300 px-3 py-2 text-sm"
            style={styleB}
          >
            {headB}
          </th>
          <th
            className="border border-slate-300 px-3 py-2 text-sm"
            style={styleC}
          >
            {headC}
          </th>
        </tr>
      </thead>
      <tbody>
        {safe.map((r, i) => (
          <tr key={i} className="align-top">
            <Td>{dash(r.point)}</Td>
            <Td>{dash(r.value)}</Td>
            <Td>{dash(r.note)}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

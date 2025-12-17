"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

// ====== ENDPOINT dari masing2 modul ======
const FORM_API = "/api/monitoring/daily/forms"; // checklist area (sudah ada)
const EVAL_API = "/api/monitoring/daily/evaluasi"; // asumsi GET rekap evaluasi
const TARGET_API = "/api/monitoring/daily/target"; // asumsi GET rekap target/achv
const PROJECT_API = "/api/monitoring/daily/projects"; // asumsi GET rekap project tracking
const AGENDA_API = "/api/monitoring/daily/agenda"; // asumsi GET rekap agenda & jadwal
const ACH_API = "/api/monitoring/daily/achievement"; // asumsi GET rekap achievement

const SIGN_API = "/api/monitoring/daily/sign"; // route PDF
const HISTORY_API = "/api/monitoring/daily/history"; // list PDF

// ====== Signature Pad ======
function SignaturePad({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";
    }
  }, []);

  function pos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    if ("touches" in e && e.touches[0]) {
      return {
        x: e.touches[0].clientX - r.left,
        y: e.touches[0].clientY - r.top,
      };
    }
    const m = e as React.MouseEvent<HTMLCanvasElement>;
    return { x: m.clientX - r.left, y: m.clientY - r.top };
  }

  const start = (e: any) => {
    e.preventDefault();
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e: any) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = ref.current;
    if (!c) return;
    onChange(c.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-slate-200 bg-white">
        <canvas
          ref={ref}
          width={640}
          height={220}
          className="w-full h-44 touch-none"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={end}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Tanda tangan di kotak di atas.</span>
        <button
          onClick={clear}
          className="ml-auto rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
        >
          Bersihkan
        </button>
      </div>
    </div>
  );
}

// ====== Helper tampil tabel mini ======
function MiniTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ k: string; v: any }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-semibold text-slate-800">{title}</div>
      {rows.length ? (
        <div className="overflow-auto rounded-lg border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-left">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-slate-50">
                  <td className="px-3 py-2 align-top">{r.k}</td>
                  <td className="px-3 py-2 align-top">{String(r.v ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs text-slate-500">Belum ada data.</div>
      )}
    </div>
  );
}

export default function DailySummaryClient() {
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [leader, setLeader] = useState("");
  const [depo, setDepo] = useState("");

  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ date: string; url: string }>>(
    []
  );

  // data tiap modul
  const [checklist, setChecklist] = useState<any[]>([]);
  const [evaluasi, setEvaluasi] = useState<any[]>([]);
  const [target, setTarget] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [achievement, setAchievement] = useState<any[]>([]);

  async function fetchHistory() {
    try {
      const qs = new URLSearchParams({ leader: leader ?? "" });
      const r = await fetch(`${HISTORY_API}?${qs}`, { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (j?.items) setHistory(j.items);
    } catch {}
  }

  async function loadAll() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        date,
        depo: depo ?? "",
        leader: leader ?? "",
      });

      // Checklist (pakai endpoint yang sudah ada)
      const r1 = await fetch(`${FORM_API}?${qs}`, { cache: "no-store" });
      const j1 = await r1.json().catch(() => null);
      setChecklist(j1?.values || []);

      // Modul lain (anggap GET rekap – kalau belum ada tetap aman)
      const [r2, r3, r4, r5, r6] = await Promise.allSettled([
        fetch(`${EVAL_API}?${qs}`),
        fetch(`${TARGET_API}?${qs}`),
        fetch(`${PROJECT_API}?${qs}`),
        fetch(`${AGENDA_API}?${qs}`),
        fetch(`${ACH_API}?${qs}`),
      ]);

      const getJson = async (res: any) =>
        res?.status === "fulfilled"
          ? await res.value.json().catch(() => null)
          : null;

      const j2 = await getJson(r2);
      setEvaluasi(j2?.rows || j2?.data || []);
      const j3 = await getJson(r3);
      setTarget(j3?.rows || j3?.data || []);
      const j4 = await getJson(r4);
      setProjects(j4?.rows || j4?.data || []);
      const j5 = await getJson(r5);
      setAgenda(j5?.rows || j5?.data || []);
      const j6 = await getJson(r6);
      setAchievement(j6?.rows || j6?.data || []);

      setSignature(j1?.form?.signature ?? null);
      await fetchHistory();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [date, depo, leader]);

  // Format jadi baris tabel sederhana (agar seragam)
  const rowsChecklist = useMemo(() => {
    // values: {section_id, field_id, value_number, value_text}
    if (!Array.isArray(checklist)) return [];
    return checklist.map((v: any) => ({
      k: `${v?.section_title || v?.section_id || ""} – ${
        v?.field_label || v?.field_id || ""
      }`,
      v:
        v?.value_text != null && v?.value_text !== ""
          ? v.value_text
          : v?.value_number ?? "",
    }));
  }, [checklist]);

  const rowsEvaluasi = (evaluasi || []).map((x: any) => ({
    k: x.title || x.k || x.item || "-",
    v: x.value ?? x.v ?? "-",
  }));
  const rowsTarget = (target || []).map((x: any) => ({
    k: x.title || x.k || x.item || "-",
    v: x.value ?? x.v ?? "-",
  }));
  const rowsProjects = (projects || []).map((x: any) => ({
    k: x.title || x.k || x.item || "-",
    v: x.value ?? x.v ?? "-",
  }));
  const rowsAgenda = (agenda || []).map((x: any) => ({
    k: x.title || x.k || x.item || "-",
    v: x.value ?? x.v ?? "-",
  }));
  const rowsAch = (achievement || []).map((x: any) => ({
    k: x.title || x.k || x.item || "-",
    v: x.value ?? x.v ?? "-",
  }));

  async function handleSaveAndPDF() {
    if (!leader) return alert("Isi Leader dulu.");
    if (!signature) return alert("Silakan tanda tangan.");

    // kirim snapshot gabungan ke route PDF
    const payload = {
      form_date: date,
      depo,
      leader,
      signature_base64: signature,
      snapshot: {
        checklist: rowsChecklist,
        evaluasi: rowsEvaluasi,
        target: rowsTarget,
        projects: rowsProjects,
        agenda: rowsAgenda,
        achievement: rowsAch,
      },
    };

    const r = await fetch(SIGN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return alert(j?.error || "Gagal membuat PDF");

    await fetchHistory();
    alert("Tersimpan & PDF dibuat!");
  }

  return (
    <main className="bg-slate-50 pb-24 input-black">
      {/* Header filter */}
      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Leader</label>
          <input
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            placeholder="Nama leader"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Depo</label>
          <input
            value={depo}
            onChange={(e) => setDepo(e.target.value)}
            placeholder="Nama depo"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Rekap gabungan */}
      <div className="grid gap-4">
        <MiniTable title="Checklist Area" rows={rowsChecklist} />
        <MiniTable title="Evaluasi Tim" rows={rowsEvaluasi} />
        <MiniTable title="Target & Achievement" rows={rowsTarget} />
        <MiniTable title="Project Tracking" rows={rowsProjects} />
        <MiniTable title="Agenda & Jadwal" rows={rowsAgenda} />
        <MiniTable title="Achievement" rows={rowsAch} />
      </div>

      {/* TTD + Simpan */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-800">
          Tanda Tangan Leader
        </div>
        <SignaturePad value={signature} onChange={setSignature} />
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={handleSaveAndPDF}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Simpan & Buat PDF
          </button>
        </div>
      </div>

      {/* Riwayat PDF */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-800">
          Riwayat PDF
        </div>
        {history?.length ? (
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="text-slate-700">{h.date}</span>
                <a
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  href={h.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat PDF
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-500">Belum ada riwayat.</div>
        )}
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
      `}</style>
    </main>
  );
}

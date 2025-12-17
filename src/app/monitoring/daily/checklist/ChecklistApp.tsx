"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, Unlock, Loader2, Plus, Pencil } from "lucide-react";

type Field = {
  id: string;
  label: string;
  type: "radio" | "number" | "text" | "currency" | "boolean" | "date";
  options?: string[] | null;
  suffix?: string | null;
  min?: number | null;
  max?: number | null;
  help?: string | null;
  position?: number;
};

type Section = {
  id: string;
  title: string;
  position?: number;
  ml_checklist_fields: Field[];
};

export default function ChecklistApp({
  template,
  canDesign,
}: {
  template: Section[];
  canDesign: boolean;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [depo, setDepo] = useState("");
  const [leader, setLeader] = useState("");
  const [sections, setSections] = useState<Section[]>(template);
  const [values, setValues] = useState<Record<string, string>>({}); // field_id -> string
  const [loading, setLoading] = useState(false);

  // load form values when date/depo change
  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/monitoring/checklist/form?date=${date}&depo=${encodeURIComponent(
            depo
          )}`
        );
        const j = await r.json();
        if (!stop && j) {
          setValues(j.values || {});
          if (j.form) setLeader(j.form.leader || "");
        }
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [date, depo]);

  const totalFields = useMemo(
    () =>
      sections.reduce(
        (acc, s) => acc + (s.ml_checklist_fields?.length || 0),
        0
      ),
    [sections]
  );
  const filledCount = useMemo(() => {
    let c = 0;
    sections.forEach((s) =>
      s.ml_checklist_fields.forEach((f) => {
        const v = values[f.id];
        if (v !== undefined && v !== null && String(v).trim() !== "") c++;
      })
    );
    return c;
  }, [sections, values]);

  function setVal(fieldId: string, v: string) {
    setValues((prev) => ({ ...prev, [fieldId]: v }));
  }

  async function save() {
    setLoading(true);
    try {
      const r = await fetch("/api/monitoring/checklist/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, depo, leader, values }),
      });
      const j = await r.json();
      if (!r.ok) alert(j?.error || "Gagal menyimpan");
      else alert("Tersimpan ✅");
    } finally {
      setLoading(false);
    }
  }

  // ===== Super Admin UI (aktif/nonaktif) =====
  const [superBusy, setSuperBusy] = useState(false);
  const [design, setDesign] = useState<boolean>(canDesign); // auto ON kalau cookie + role ok

  async function enableSA() {
    const pwd = prompt("Masukkan password Super Admin");
    if (!pwd) return;
    setSuperBusy(true);
    try {
      const r = await fetch("/api/super-admin/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        alert(j?.error || "Password salah");
        return;
      }
      location.reload();
    } finally {
      setSuperBusy(false);
    }
  }
  async function disableSA() {
    setSuperBusy(true);
    try {
      await fetch("/api/super-admin/disable", { method: "POST" });
      location.reload();
    } finally {
      setSuperBusy(false);
    }
  }

  // Tambah & rename section (design mode)
  async function addSection() {
    const title = prompt("Judul section baru?");
    if (!title) return;
    const r = await fetch("/api/monitoring/checklist/template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || "Gagal tambah section");
    setSections((s) => [
      ...s,
      { id: j.section.id, title: j.section.title, ml_checklist_fields: [] },
    ]);
  }
  async function renameSection(id: string, current: string) {
    const title = prompt("Ganti nama section:", current);
    if (!title || title === current) return;
    const r = await fetch("/api/monitoring/checklist/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || "Gagal rename");
    setSections((s) => s.map((x) => (x.id === id ? { ...x, title } : x)));
  }

  // ====== UI ======
  return (
    <main className="bg-slate-50 pb-20">
      {/* Header: tanggal / depo / leader + SA toggle */}
      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
        <div>
          <label className="text-xs font-medium text-slate-600">Leader</label>
          <input
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            placeholder="Auto dari user / manual"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end justify-end">
          {!canDesign ? (
            <button
              onClick={enableSA}
              disabled={superBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {superBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              Mode Super Admin
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <Unlock className="h-3 w-3" /> Aktif
              </span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={design}
                  onChange={(e) => setDesign(e.target.checked)}
                />
                <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-700 ring-1 ring-amber-200">
                  Design mode
                </span>
              </label>
              <button
                onClick={disableSA}
                disabled={superBusy}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress baris terisi + tombol design */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-base font-semibold text-slate-800">
            Checklist Area Harian
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
              Terisi: {filledCount}/{totalFields}
            </div>
            {design && (
              <button
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Tambah Section
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render sections */}
      <div className="grid gap-6">
        {sections.map((sec) => (
          <section
            key={sec.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                {sec.title}
              </h2>
              {design && (
                <button
                  onClick={() => renameSection(sec.id, sec.title)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Ganti Nama
                </button>
              )}
            </div>

            {/* Fields grid */}
            <div className="grid gap-3 md:grid-cols-2">
              {sec.ml_checklist_fields?.map((f) => {
                const val = values[f.id] ?? "";
                return (
                  <div key={f.id} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      {f.label}{" "}
                      {f.help ? (
                        <span className="text-xs text-slate-500">
                          ({f.help})
                        </span>
                      ) : null}
                    </label>

                    {/* field types */}
                    {f.type === "radio" && (
                      <div className="flex flex-wrap gap-2">
                        {(f.options || []).map((opt) => {
                          const checked = val === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setVal(f.id, opt!)}
                              className={
                                "rounded-xl px-3 py-1.5 text-sm ring-1 transition " +
                                (checked
                                  ? "bg-blue-600 text-white ring-blue-600"
                                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50")
                              }
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {f.type === "number" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={f.min ?? undefined}
                          max={f.max ?? undefined}
                          value={val}
                          onChange={(e) => setVal(f.id, e.target.value)}
                          className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        {f.suffix ? (
                          <span className="text-sm text-slate-600">
                            {f.suffix}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {f.type === "text" && (
                      <input
                        value={val}
                        onChange={(e) => setVal(f.id, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {f.type === "currency" && (
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          Rp
                        </span>
                        <input
                          value={(val || "")
                            .replace(/[^\d]/g, "")
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                          onChange={(e) =>
                            setVal(f.id, e.target.value.replace(/[^\d]/g, ""))
                          }
                          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={save}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </main>
  );
}

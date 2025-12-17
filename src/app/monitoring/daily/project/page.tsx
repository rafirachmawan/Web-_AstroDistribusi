// ================= src/app/monitoring/daily/project/page.tsx =================
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Plus, Save, Trash2, Loader2, CalendarDays } from "lucide-react";

/* ===================== Types & Utils ===================== */
type Step = { id: string; text: string; done: boolean; idx: number };
type Project = {
  id: string;
  title: string; // contoh: "Penyelesaian Klaim UDI"
  pic?: string | null; // optional PIC
  deadline: string | null; // ISO (YYYY-MM-DD)
  steps: Step[];
  percentage: number; // 0..100
  progress: string;
  next_action: string;
  risks: string;
  created_at?: string;
  updated_at?: string;
};

function daysLeft(deadlineISO: string | null | undefined) {
  if (!deadlineISO) return null;
  const today = new Date();
  const d = new Date(deadlineISO);
  const diff = Math.ceil(
    (d.getTime() - new Date(today.toDateString()).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return diff; // bisa negatif (telat)
}

function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function emptyProject(): Project {
  return {
    id: "NEW",
    title: "",
    pic: "",
    deadline: null,
    steps: [{ id: crypto.randomUUID(), text: "", done: false, idx: 0 }],
    percentage: 0,
    progress: "",
    next_action: "",
    risks: "",
  };
}

function recomputePercentage(steps: Step[]) {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

/* ===================== Page ===================== */
export default function ProjectPage() {
  const supabase = supabaseBrowser();

  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => items.find((p) => p.id === selectedId) ?? null,
    [items, selectedId]
  );

  // Fetch list dari Supabase
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_tracking")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        console.error(error);
        setItems([]);
      } else {
        const norm = (data ?? []).map((row: any) => ({
          ...row,
          steps: (row.steps ?? []).sort((a: Step, b: Step) => a.idx - b.idx),
        }));
        setItems(norm);
        if (norm.length && !selectedId) setSelectedId(norm[0].id);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== Handlers ===================== */
  function handlePick(p: Project) {
    setSelectedId(p.id);
  }

  // PLUS: tambah 1 poin project (blok baru seperti di gambar)
  function handleNew() {
    const p = emptyProject();
    setItems((s) => [p, ...s]);
    setSelectedId(p.id);
  }

  function patchSelected(patch: Partial<Project>) {
    if (!selected) return;
    setItems((list) =>
      list.map((it) => (it.id === selected.id ? { ...it, ...patch } : it))
    );
  }

  function patchStep(stepId: string, patch: Partial<Step>) {
    if (!selected) return;
    const nextSteps = selected.steps.map((s) =>
      s.id === stepId ? { ...s, ...patch } : s
    );
    patchSelected({
      steps: nextSteps,
      // bonus: persentase otomatis dari checkbox
      percentage: recomputePercentage(nextSteps),
    });
  }

  function addStep() {
    if (!selected) return;
    const nextIdx =
      selected.steps.length > 0
        ? Math.max(...selected.steps.map((s) => s.idx)) + 1
        : 0;
    const nextSteps = [
      ...selected.steps,
      { id: crypto.randomUUID(), text: "", done: false, idx: nextIdx },
    ];
    patchSelected({
      steps: nextSteps,
      percentage: recomputePercentage(nextSteps),
    });
  }

  function removeStep(stepId: string) {
    if (!selected) return;
    const nextSteps = selected.steps.filter((s) => s.id !== stepId);
    patchSelected({
      steps: nextSteps,
      percentage: recomputePercentage(nextSteps),
    });
  }

  // SIMPAN: benar-benar ke Supabase (insert/update)
  async function save() {
    if (!selected) return;
    if (!selected.title?.trim()) {
      alert("Judul project wajib diisi.");
      return;
    }
    setSaving(true);

    const steps = [...selected.steps].sort((a, b) => a.idx - b.idx);

    if (selected.id === "NEW") {
      const { data, error } = await supabase
        .from("project_tracking")
        .insert([
          {
            title: selected.title,
            pic: selected.pic || null,
            deadline: selected.deadline,
            steps,
            percentage: selected.percentage ?? 0,
            progress: selected.progress ?? "",
            next_action: selected.next_action ?? "",
            risks: selected.risks ?? "",
          },
        ])
        .select("*")
        .single();

      if (error) {
        alert("Gagal menyimpan: " + error.message);
      } else {
        setItems((list) =>
          list.map((it) => (it.id === "NEW" ? { ...data, steps } : it))
        );
        setSelectedId(data.id);
      }
    } else {
      const { data, error } = await supabase
        .from("project_tracking")
        .update({
          title: selected.title,
          pic: selected.pic || null,
          deadline: selected.deadline,
          steps,
          percentage: selected.percentage ?? 0,
          progress: selected.progress ?? "",
          next_action: selected.next_action ?? "",
          risks: selected.risks ?? "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id)
        .select("*")
        .single();

      if (error) {
        alert("Gagal update: " + error.message);
      } else {
        setItems((list) =>
          list.map((it) => (it.id === selected.id ? { ...data, steps } : it))
        );
      }
    }

    setSaving(false);
  }

  async function removeProject(id: string) {
    if (!confirm("Hapus project ini?")) return;
    const { error } = await supabase
      .from("project_tracking")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }
    setItems((s) => s.filter((x) => x.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  /* ===================== UI ===================== */
  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Project Tracking
      </h1>

      <div className="grid gap-4 md:grid-cols-[280px,1fr]">
        {/* ===== Sidebar: daftar project ===== */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium text-slate-800">Daftar Project</div>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
              title="Tambah project"
            >
              <Plus size={16} /> Baru
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="animate-spin" size={16} /> memuat...
            </div>
          ) : items.length === 0 ? (
            <div className="text-slate-500">Belum ada project.</div>
          ) : (
            <ul className="space-y-1">
              {items.map((p) => {
                const left = daysLeft(p.deadline);
                const badge =
                  left === null
                    ? "-"
                    : left < 0
                    ? `${left} hari`
                    : `+${left} hari`;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => handlePick(p)}
                      className={cls(
                        "w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50",
                        p.id === selectedId ? "bg-slate-100" : ""
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="truncate font-medium text-slate-800">
                          {p.title || "Untitled"}
                        </div>
                        <span
                          className={cls(
                            "ml-2 shrink-0 rounded-md border px-2 py-0.5 text-xs",
                            left === null
                              ? "border-slate-300 text-slate-500"
                              : left < 0
                              ? "border-rose-300 text-rose-600"
                              : "border-emerald-300 text-emerald-600"
                          )}
                          title="Sisa waktu"
                        >
                          {badge}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {p.percentage ?? 0}% • {p.pic || "PIC -"}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ===== Editor ===== */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-sm">
          {!selected ? (
            <div className="text-slate-500">
              Pilih atau tambah project untuk mulai mengedit.
            </div>
          ) : (
            <>
              {/* Header merah + tombol tambah poin */}
              <div className="mb-4 flex items-center gap-2">
                <div className="inline-block rounded-md bg-rose-600 px-3 py-1 text-sm font-semibold text-white">
                  SPARTA Project Tracking
                </div>
                <button
                  onClick={handleNew}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800 hover:bg-slate-50"
                  title="Tambah 1 Poin Project"
                >
                  <Plus size={14} /> Tambah Poin
                </button>
              </div>

              {/* Ketentuan */}
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="grid gap-2 md:grid-cols-[160px,1fr]">
                  <div className="font-medium">Ketentuan</div>
                  <ul className="list-disc pl-5">
                    <li>Tidak boleh jawaban copy-paste</li>
                    <li>Tidak boleh jawaban generik, maupun kurang detail</li>
                  </ul>
                </div>
              </div>

              {/* Judul Project + Deadline + Sisa waktu */}
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr,220px,160px]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Judul Project
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Contoh: Penyelesaian Klaim UDI"
                    value={selected.title}
                    onChange={(e) => patchSelected({ title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Deadline
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">
                      <CalendarDays size={18} />
                    </span>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                      value={selected.deadline ?? ""}
                      onChange={(e) =>
                        patchSelected({ deadline: e.target.value || null })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Sisa waktu
                  </label>
                  <div
                    className={cls(
                      "flex h-[38px] items-center justify-center rounded-xl border px-3 text-sm",
                      (daysLeft(selected.deadline) ?? 0) < 0
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {(() => {
                      const left = daysLeft(selected.deadline);
                      if (left === null) return "-";
                      return left < 0 ? `${left} hari` : `+${left} hari`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Steps / Langkah-langkah */}
              <div className="mb-5 rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
                  Langkah-Langkah
                </div>
                <div className="divide-y divide-slate-200">
                  {selected.steps.map((s, idx) => (
                    <div
                      key={s.id}
                      className="grid items-start gap-3 p-3 md:grid-cols-[34px,1fr,40px]"
                    >
                      <input
                        type="checkbox"
                        className="mt-2 h-4 w-4 accent-slate-800"
                        checked={s.done}
                        onChange={(e) =>
                          patchStep(s.id, { done: e.target.checked })
                        }
                      />
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                        placeholder={`Langkah ${idx + 1}`}
                        value={s.text}
                        onChange={(e) =>
                          patchStep(s.id, { text: e.target.value })
                        }
                      />
                      <button
                        onClick={() => removeStep(s.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        title="Hapus langkah"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 p-3">
                  <button
                    onClick={addStep}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
                  >
                    <Plus size={16} /> Tambah langkah
                  </button>
                </div>
              </div>

              {/* Persentase */}
              <div className="mb-5 grid gap-3 md:grid-cols-[160px,1fr]">
                <label className="text-sm font-medium text-slate-700">
                  Persentase
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                    value={selected.percentage ?? 0}
                    onChange={(e) =>
                      patchSelected({
                        percentage: Math.max(
                          0,
                          Math.min(100, Number(e.target.value || 0))
                        ),
                      })
                    }
                  />
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-800"
                      style={{ width: `${selected.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4 grid gap-3 md:grid-cols-[160px,1fr]">
                <label className="pt-2 text-sm font-medium text-slate-700">
                  Progress
                </label>
                <textarea
                  rows={3}
                  className="min-h-[88px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                  placeholder="contoh: sudah selesai sampai Q4 2024, Q1 & Q2 2025 menunggu jawaban..."
                  value={selected.progress}
                  onChange={(e) => patchSelected({ progress: e.target.value })}
                />
              </div>

              {/* Next Action */}
              <div className="mb-4 grid gap-3 md:grid-cols-[160px,1fr]">
                <label className="pt-2 text-sm font-medium text-slate-700">
                  Next Action
                </label>
                <textarea
                  rows={2}
                  className="min-h-[64px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                  placeholder="contoh: besok follow up ke pak Adi..."
                  value={selected.next_action}
                  onChange={(e) =>
                    patchSelected({ next_action: e.target.value })
                  }
                />
              </div>

              {/* Bottlenecks / Risks */}
              <div className="mb-6 grid gap-3 md:grid-cols-[160px,1fr]">
                <label className="pt-2 text-sm font-medium text-slate-700">
                  Bottlenecks / Risks
                </label>
                <textarea
                  rows={2}
                  className="min-h-[64px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
                  placeholder="berisi hambatan, risiko teridentifikasi, bantuan yang dibutuhkan"
                  value={selected.risks}
                  onChange={(e) => patchSelected({ risks: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Target & Achievement (placeholder)
                </div>
                <div className="flex items-center gap-2">
                  {selected.id !== "NEW" && (
                    <button
                      onClick={() => removeProject(selected.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 size={16} /> Hapus
                    </button>
                  )}
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? "Menyimpan..." : "Simpan ke Supabase"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

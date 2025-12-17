// ================= src/app/pelatihan/progress/page.tsx =================
"use client";
import { MODULES } from "../../../component/training/TrainingData";
import { getProgress } from "../../../component/training/useProgress";

export default function ProgressPage() {
  const prog = getProgress();

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Progress Pelatihan
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => {
          const p = prog[m.id] || { completedLessons: [] };
          const pct = Math.round(
            (p.completedLessons.length / (m.lessons.length || 1)) * 100
          );
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-800">
                    {m.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    Role: {m.role} · Level: {m.level}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    p.passed
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : "bg-slate-50 text-slate-700 ring-slate-100"
                  }`}
                >
                  {p.passed ? "Lulus" : "Belum"}
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Progress: {p.completedLessons.length}/{m.lessons.length} ({pct}
                %) · Nilai: {p.quizScore ?? "-"}%
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

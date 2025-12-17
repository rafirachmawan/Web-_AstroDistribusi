// ================= src/app/pelatihan/katalog/page.tsx =================
"use client";
import { MODULES } from "../../../component/training//TrainingData";
import { getProgress } from "../../../component/training/useProgress";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function KatalogPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("Semua");
  const progress = getProgress();

  const list = useMemo(
    () =>
      MODULES.filter(
        (m) =>
          (role === "Semua" || m.role === role) &&
          (m.title.toLowerCase().includes(q.toLowerCase()) ||
            (m.description || "").toLowerCase().includes(q.toLowerCase()))
      ),
    [q, role]
  );

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Katalog Pelatihan
      </h1>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
        <input
          placeholder="Cari modul…"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {["Semua", "Sales", "Leader", "HR", "All"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <div className="lg:col-span-4" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((m) => {
          const p = progress[m.id];
          const done = p?.completedLessons?.length || 0;
          const total = m.lessons.length;
          const pct = Math.round((done / (total || 1)) * 100);
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
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                  {total} materi
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{m.description}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Progress: {done}/{total} ({pct}%)
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/pelatihan/modul/${m.id}`}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  {done ? "Lanjutkan" : "Mulai"}
                </Link>
                {p?.passed && (
                  <Link
                    href={`/pelatihan/sertifikat/${m.id}`}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Sertifikat
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .input-black input,
        .input-black select {
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

// ================= src/components/SalesFilter.tsx =================
"use client";
import React from "react";

type Props = {
  onChange?: (v: { date?: string; team?: string; q?: string }) => void;
};
export default function SalesFilter({ onChange }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6 input-black">
      <input
        placeholder="Cari nama customer…"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        onChange={(e) => onChange?.({ q: e.target.value })}
      />
      <input
        type="date"
        defaultValue={today}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        onChange={(e) => onChange?.({ date: e.target.value })}
      />
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        onChange={(e) => onChange?.({ team: e.target.value })}
      >
        {["Semua Tim", "Tim A", "Tim B", "Tim C"].map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <div className="lg:col-span-3 flex items-end">
        <button className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Terapkan
        </button>
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
    </div>
  );
}

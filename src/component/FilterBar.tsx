// ================ src/components/FilterBar.tsx =================
"use client";
import React from "react";

type Props = {
  warehouses?: string[];
  principles?: string[];
  onSearch?: (q: string) => void;
  onChange?: (v: {
    warehouse?: string;
    principle?: string;
    from?: string;
    to?: string;
  }) => void;
};

export default function FilterBar({
  warehouses = ["Gudang A", "Gudang B", "Gudang C"],
  principles = ["Semua", "Principle 1", "Principle 2"],
  onSearch,
  onChange,
}: Props) {
  return (
    <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
      <input
        type="text"
        placeholder="Cari nama/kode barang…"
        className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onChange?.({ warehouse: e.target.value })}
      >
        {warehouses.map((w) => (
          <option key={w}>{w}</option>
        ))}
      </select>
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onChange?.({ principle: e.target.value })}
      >
        {principles.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <input
        type="date"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onChange?.({ from: e.target.value })}
      />
      <input
        type="date"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onChange?.({ to: e.target.value })}
      />
    </div>
  );
}

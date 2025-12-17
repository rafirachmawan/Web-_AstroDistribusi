// ================= src/components/CustomerPicker.tsx =================
"use client";
import React from "react";

const CUSTOMERS = [
  {
    id: "c1",
    name: "Toko Sejahtera",
    address: "Jl. Melati 12",
    lat: -6.2,
    lng: 106.8,
  },
  {
    id: "c2",
    name: "Warung Makmur",
    address: "Jl. Kenanga 8",
    lat: -6.21,
    lng: 106.82,
  },
  {
    id: "c3",
    name: "Grosir Abadi",
    address: "Jl. Anggrek 5",
    lat: -6.22,
    lng: 106.81,
  },
];

export type Customer = (typeof CUSTOMERS)[number];

export default function CustomerPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Pilih Customer…</option>
      {CUSTOMERS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

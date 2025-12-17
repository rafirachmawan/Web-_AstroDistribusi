// ================= src/app/sales/customers/page.tsx =================
"use client";
import { useMemo, useState } from "react";
import SalesFilter from "../../../component/SalesFilter";

type Row = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CustomersPage() {
  const [rows, setRows] = useState<Row[]>([
    {
      id: uid(),
      name: "Toko Sejahtera",
      address: "Jl. Melati 12",
      phone: "0812-3456-7890",
      lat: -6.2,
      lng: 106.8,
    },
    {
      id: uid(),
      name: "Warung Makmur",
      address: "Jl. Kenanga 8",
      phone: "0813-9876-5432",
      lat: -6.21,
      lng: 106.82,
    },
  ]);
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          r.address.toLowerCase().includes(q.toLowerCase())
      ),
    [rows, q]
  );

  const [form, setForm] = useState<Partial<Row>>({});

  function add() {
    if (!form.name || !form.address) return alert("Nama & alamat wajib diisi");
    setRows((s) => [
      ...s,
      {
        id: uid(),
        name: form.name!,
        address: form.address!,
        phone: form.phone,
        lat: form.lat,
        lng: form.lng,
      },
    ]);
    setForm({});
  }

  function remove(id: string) {
    setRows((s) => s.filter((r) => r.id !== id));
  }

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">Customers</h1>
      <SalesFilter onChange={(v) => setQ(v.q || "")} />

      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Nama
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.name || ""}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Alamat
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.address || ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, address: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Telepon
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.phone || ""}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Koordinat (lat,lng)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="lat"
              value={(form.lat as any) || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, lat: Number(e.target.value) }))
              }
            />
            <input
              type="number"
              step="any"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="lng"
              value={(form.lng as any) || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, lng: Number(e.target.value) }))
              }
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={add}
            className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Tambah Customer
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Daftar Customer
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {["Nama", "Alamat", "Telepon", "Koordinat", ""].map((k) => (
                  <th
                    key={k}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 text-sm text-slate-700">{r.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.address}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.phone}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.lat?.toFixed(5)}, {r.lng?.toFixed(5)}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

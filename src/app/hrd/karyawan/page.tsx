// ================= src/app/hrd/karyawan/page.tsx =================
"use client";
import { useMemo, useState } from "react";
import InputBlack from "../../../component/hrd/InputBlack";

type Emp = {
  id: string;
  nip: string;
  name: string;
  role: string;
  joinDate: string;
  email?: string;
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function KaryawanPage() {
  const [rows, setRows] = useState<Emp[]>([
    {
      id: uid(),
      nip: "EMP-0001",
      name: "Andi Saputra",
      role: "Sales",
      joinDate: "2024-01-10",
      email: "andi@astro",
    },
    {
      id: uid(),
      nip: "EMP-0002",
      name: "Budi Santoso",
      role: "Leader",
      joinDate: "2023-09-02",
      email: "budi@astro",
    },
  ]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Partial<Emp>>({
    joinDate: new Date().toISOString().slice(0, 10),
  });

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          r.nip.toLowerCase().includes(q.toLowerCase())
      ),
    [rows, q]
  );

  function add() {
    if (!form.nip || !form.name || !form.role)
      return alert("NIP, Nama, Role wajib");
    setRows((s) => [
      ...s,
      {
        id: uid(),
        nip: form.nip!,
        name: form.name!,
        role: form.role!,
        joinDate: form.joinDate!,
        email: form.email,
      },
    ]);
    setForm({ joinDate: new Date().toISOString().slice(0, 10) });
  }
  function remove(id: string) {
    setRows((s) => s.filter((r) => r.id !== id));
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Data Karyawan
      </h1>

      <InputBlack>
        <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
          <input
            placeholder="Cari NIP/Nama…"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            placeholder="NIP"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.nip || ""}
            onChange={(e) => setForm((s) => ({ ...s, nip: e.target.value }))}
          />
          <input
            placeholder="Nama"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.name || ""}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.role || ""}
            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
          >
            <option value="">Pilih Role…</option>
            {["Sales", "Leader", "HR", "Gudang", "Finance"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.joinDate || ""}
            onChange={(e) =>
              setForm((s) => ({ ...s, joinDate: e.target.value }))
            }
          />
          <div className="lg:col-span-1 flex items-end">
            <button
              onClick={add}
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Tambah
            </button>
          </div>
        </div>
      </InputBlack>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Daftar Karyawan
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {["NIP", "Nama", "Role", "Join Date", "Email", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 text-sm text-slate-700">{r.nip}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">{r.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">{r.role}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.joinDate}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.email || "-"}
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
    </main>
  );
}

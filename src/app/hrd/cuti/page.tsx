// ================= src/app/hrd/cuti/page.tsx =================
"use client";
import { useMemo, useState } from "react";
import InputBlack from "../../../component/hrd/InputBlack";

type Leave = {
  id: string;
  emp: string;
  type: "Cuti" | "Izin" | "Sakit";
  from: string;
  to: string;
  reason?: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CutiPage() {
  const [rows, setRows] = useState<Leave[]>([
    {
      id: uid(),
      emp: "Andi Saputra",
      type: "Cuti",
      from: "2025-10-10",
      to: "2025-10-12",
      reason: "Acara keluarga",
      status: "Menunggu",
    },
  ]);
  const [form, setForm] = useState<Partial<Leave>>({
    type: "Cuti",
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const totalWaiting = useMemo(
    () => rows.filter((r) => r.status === "Menunggu").length,
    [rows]
  );

  function add() {
    if (!form.emp || !form.type || !form.from || !form.to)
      return alert("Isi semua kolom wajib");
    setRows((s) => [
      {
        id: uid(),
        emp: form.emp!,
        type: form.type as any,
        from: form.from!,
        to: form.to!,
        reason: form.reason,
        status: "Menunggu",
      },
      ...s,
    ]);
    setForm({
      type: "Cuti",
      from: new Date().toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    });
  }
  function setStatus(id: string, status: Leave["status"]) {
    setRows((s) => s.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">Cuti/Izin</h1>

      <InputBlack>
        <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
          <input
            placeholder="Nama Karyawan"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.emp || ""}
            onChange={(e) => setForm((s) => ({ ...s, emp: e.target.value }))}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.type as any}
            onChange={(e) =>
              setForm((s) => ({ ...s, type: e.target.value as any }))
            }
          >
            <option>Cuti</option>
            <option>Izin</option>
            <option>Sakit</option>
          </select>
          <input
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.from || ""}
            onChange={(e) => setForm((s) => ({ ...s, from: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.to || ""}
            onChange={(e) => setForm((s) => ({ ...s, to: e.target.value }))}
          />
          <input
            placeholder="Alasan"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-2"
            value={form.reason || ""}
            onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
          />
          <div className="lg:col-span-6 flex justify-end">
            <button
              onClick={add}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Ajukan
            </button>
          </div>
        </div>
      </InputBlack>

      <div className="mb-3 text-sm text-slate-600">
        Menunggu approval:{" "}
        <span className="font-semibold text-slate-800">{totalWaiting}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Daftar Pengajuan
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {[
                  "Karyawan",
                  "Jenis",
                  "Periode",
                  "Alasan",
                  "Status",
                  "Aksi",
                ].map((h) => (
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
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 text-sm text-slate-700">{r.emp}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">{r.type}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.from} → {r.to}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.reason}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {r.status}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(r.id, "Disetujui")}
                        className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => setStatus(r.id, "Ditolak")}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Tolak
                      </button>
                    </div>
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

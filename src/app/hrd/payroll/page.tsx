"use client";
import { useMemo, useState } from "react";

type PayRow = {
  id: string;
  emp: string;
  base: number;
  allowance?: number;
  deduction?: number;
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function PayrollPage() {
  const [month, setMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [rows, setRows] = useState<PayRow[]>([
    {
      id: uid(),
      emp: "Andi Saputra",
      base: 4500000,
      allowance: 500000,
      deduction: 100000,
    },
    {
      id: uid(),
      emp: "Budi Santoso",
      base: 6000000,
      allowance: 750000,
      deduction: 0,
    },
  ]);

  const total = useMemo(
    () =>
      rows.reduce(
        (a, r) => a + (r.base + (r.allowance || 0) - (r.deduction || 0)),
        0
      ),
    [rows]
  );

  function add() {
    setRows((s) => [
      ...s,
      { id: uid(), emp: "", base: 0, allowance: 0, deduction: 0 },
    ]);
  }
  function remove(id: string) {
    setRows((s) => s.filter((r) => r.id !== id));
  }

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">Payroll</h1>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Periode (YYYY-MM)
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">
            Daftar Gaji
          </div>
          <button
            onClick={add}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Baris
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {[
                  "Karyawan",
                  "Gaji Pokok",
                  "Tunjangan",
                  "Potongan",
                  "Take Home Pay",
                  "",
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
              {rows.map((r) => {
                const thp = r.base + (r.allowance || 0) - (r.deduction || 0);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <input
                        className="w-56 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        value={r.emp}
                        onChange={(e) =>
                          setRows((s) =>
                            s.map((x) =>
                              x.id === r.id ? { ...x, emp: e.target.value } : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        value={r.base as any}
                        onChange={(e) =>
                          setRows((s) =>
                            s.map((x) =>
                              x.id === r.id
                                ? { ...x, base: Number(e.target.value || 0) }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        value={(r.allowance as any) || 0}
                        onChange={(e) =>
                          setRows((s) =>
                            s.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    allowance: Number(e.target.value || 0),
                                  }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        value={(r.deduction as any) || 0}
                        onChange={(e) =>
                          setRows((s) =>
                            s.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    deduction: Number(e.target.value || 0),
                                  }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-sm tabular-nums">
                      {thp.toLocaleString()}
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
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="text-slate-600">
            Periode:{" "}
            <span className="font-semibold text-slate-800">{month}</span>
          </div>
          <div className="text-slate-700">
            Total THP:{" "}
            <span className="tabular-nums font-semibold">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* pastikan input & placeholder hitam */}
      <style jsx global>{`
        .input-black input,
        .input-black select,
        .input-black textarea {
          color: #000;
        }
        .input-black input::placeholder,
        .input-black textarea::placeholder {
          color: #000;
          opacity: 0.6;
        }
      `}</style>
    </main>
  );
}

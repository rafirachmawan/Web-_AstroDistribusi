"use client";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  emp: string;
  kpi: string;
  score?: number;
  notes?: string;
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function PenilaianPage() {
  const [rows, setRows] = useState<Row[]>([
    { id: uid(), emp: "Andi Saputra", kpi: "Jumlah Kunjungan", score: 4 },
    { id: uid(), emp: "Budi Santoso", kpi: "Coverage Area", score: 3 },
  ]);

  const avg = useMemo(() => {
    const list = rows.map((r) => r.score).filter(Boolean) as number[];
    if (!list.length) return 0;
    return (
      Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10
    );
  }, [rows]);

  function setScore(id: string, v: number) {
    setRows((s) =>
      s.map((r) =>
        r.id === id ? { ...r, score: Math.max(1, Math.min(5, v)) } : r
      )
    );
  }
  function add() {
    setRows((s) => [...s, { id: uid(), emp: "", kpi: "", score: undefined }]);
  }
  function remove(id: string) {
    setRows((s) => s.filter((r) => r.id !== id));
  }

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Penilaian (OKR/KPI)
      </h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">Matrix KPI</div>
          <button
            onClick={add}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Tambah Baris
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {["Karyawan", "KPI", "Skor (1-5)", "Catatan", ""].map((h) => (
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
                      className="w-72 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={r.kpi}
                      onChange={(e) =>
                        setRows((s) =>
                          s.map((x) =>
                            x.id === r.id ? { ...x, kpi: e.target.value } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={(r.score as any) || ""}
                      onChange={(e) =>
                        setScore(r.id, Number(e.target.value || 0))
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-80 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      value={r.notes || ""}
                      onChange={(e) =>
                        setRows((s) =>
                          s.map((x) =>
                            x.id === r.id ? { ...x, notes: e.target.value } : x
                          )
                        )
                      }
                    />
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

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="text-slate-600">Total Baris: {rows.length}</div>
          <div className="text-slate-700">
            Rata-rata Skor:{" "}
            <span className="tabular-nums font-semibold">{avg}</span>
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

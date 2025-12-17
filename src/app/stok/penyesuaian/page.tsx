"use client";
import { useMemo, useState } from "react";

type JenisAdj = "Opname" | "Koreksi" | "Write-off";

type Item = {
  id: string;
  kode?: string;
  nama?: string;
  stokL?: number;
  stokM?: number;
  stokS?: number;
  fisikL?: number;
  fisikM?: number;
  fisikS?: number;
  ed?: string;
  catatan?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function NumberCell({
  value,
  onChange,
  placeholder,
}: {
  value?: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(Number(e.target.value || 0))}
    />
  );
}

export default function PenyesuaianPage() {
  // Header
  const [gudang, setGudang] = useState("Gudang A");
  const [jenis, setJenis] = useState<JenisAdj>("Opname");
  const [tanggal, setTanggal] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dokNo, setDokNo] = useState("");
  const [catatanHdr, setCatatanHdr] = useState("");

  // Items
  const [items, setItems] = useState<Item[]>([{ id: uid() }]);

  function addRow() {
    setItems((s) => [...s, { id: uid() }]);
  }
  function removeRow(id: string) {
    setItems((s) => s.filter((it) => it.id !== id));
  }
  function patchRow(id: string, patch: Partial<Item>) {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  const totals = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        const dL = (it.fisikL || 0) - (it.stokL || 0);
        const dM = (it.fisikM || 0) - (it.stokM || 0);
        const dS = (it.fisikS || 0) - (it.stokS || 0);
        acc.deltaL += dL;
        acc.deltaM += dM;
        acc.deltaS += dS;
        return acc;
      },
      { deltaL: 0, deltaM: 0, deltaS: 0 }
    );
  }, [items]);

  function onSubmit() {
    const payload = {
      header: { gudang, jenis, tanggal, dokNo, catatan: catatanHdr },
      items: items.map((it) => ({
        ...it,
        deltaL: (it.fisikL || 0) - (it.stokL || 0),
        deltaM: (it.fisikM || 0) - (it.stokM || 0),
        deltaS: (it.fisikS || 0) - (it.stokS || 0),
      })),
      totals,
    };
    console.log("SUBMIT PENYESUAIAN:", payload);
    alert(
      "(Demo) Data penyesuaian dicetak ke console. Integrasi backend menyusul."
    );
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Penyesuaian & Audit
      </h1>

      {/* Header Card */}
      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Gudang</label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            value={gudang}
            onChange={(e) => setGudang(e.target.value)}
          >
            {["Gudang A", "Gudang B", "Gudang C", "Gudang D", "Gudang E"].map(
              (g) => (
                <option key={g}>{g}</option>
              )
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Jenis</label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisAdj)}
          >
            <option>Opname</option>
            <option>Koreksi</option>
            <option>Write-off</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Tanggal</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            No. Dokumen
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            value={dokNo}
            onChange={(e) => setDokNo(e.target.value)}
            placeholder="ADJ-2025-0001"
          />
        </div>

        <div className="space-y-1 md:col-span-2 lg:col-span-1">
          <label className="text-xs font-medium text-slate-600">Catatan</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            value={catatanHdr}
            onChange={(e) => setCatatanHdr(e.target.value)}
            placeholder="Catatan (optional)"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">
            Daftar Item
          </div>
          <button
            onClick={addRow}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Tambah Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                {[
                  "Kode",
                  "Nama",
                  "Stok L",
                  "Stok M",
                  "Stok S",
                  "Fisik L",
                  "Fisik M",
                  "Fisik S",
                  "Δ L",
                  "Δ M",
                  "Δ S",
                  "ED",
                  "Catatan",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((it) => {
                const dL = (it.fisikL || 0) - (it.stokL || 0);
                const dM = (it.fisikM || 0) - (it.stokM || 0);
                const dS = (it.fisikS || 0) - (it.stokS || 0);
                return (
                  <tr key={it.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <input
                        className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                        value={it.kode || ""}
                        placeholder="BRG-001"
                        onChange={(e) =>
                          patchRow(it.id, { kode: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-[280px] max-w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                        value={it.nama || ""}
                        placeholder="Nama Barang"
                        onChange={(e) =>
                          patchRow(it.id, { nama: e.target.value })
                        }
                      />
                    </td>

                    {/* stok sistem */}
                    <td className="px-4 py-2">
                      <NumberCell
                        value={it.stokL}
                        onChange={(v) => patchRow(it.id, { stokL: v })}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <NumberCell
                        value={it.stokM}
                        onChange={(v) => patchRow(it.id, { stokM: v })}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <NumberCell
                        value={it.stokS}
                        onChange={(v) => patchRow(it.id, { stokS: v })}
                        placeholder="0"
                      />
                    </td>

                    {/* fisik */}
                    <td className="px-4 py-2">
                      <NumberCell
                        value={it.fisikL}
                        onChange={(v) => patchRow(it.id, { fisikL: v })}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <NumberCell
                        value={it.fisikM}
                        onChange={(v) => patchRow(it.id, { fisikM: v })}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <NumberCell
                        value={it.fisikS}
                        onChange={(v) => patchRow(it.id, { fisikS: v })}
                        placeholder="0"
                      />
                    </td>

                    {/* delta */}
                    {[dL, dM, dS].map((d, i) => (
                      <td key={i} className="px-4 py-2">
                        <span
                          className={
                            "tabular-nums text-sm font-semibold " +
                            (d > 0
                              ? "text-green-600"
                              : d < 0
                              ? "text-rose-600"
                              : "text-slate-700")
                          }
                        >
                          {d}
                        </span>
                      </td>
                    ))}

                    <td className="px-4 py-2">
                      <input
                        type="date"
                        className="w-40 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                        value={it.ed || ""}
                        onChange={(e) =>
                          patchRow(it.id, { ed: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-56 max-w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                        value={it.catatan || ""}
                        placeholder="Catatan per item"
                        onChange={(e) =>
                          patchRow(it.id, { catatan: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeRow(it.id)}
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

        {/* Footer totals */}
        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="text-slate-700">
            Δ L:{" "}
            <span className="tabular-nums font-semibold">{totals.deltaL}</span>
          </div>
          <div className="text-slate-700">
            Δ M:{" "}
            <span className="tabular-nums font-semibold">{totals.deltaM}</span>
          </div>
          <div className="text-slate-700">
            Δ S:{" "}
            <span className="tabular-nums font-semibold">{totals.deltaS}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Simpan Draft
        </button>
        <button
          onClick={onSubmit}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Simpan Penyesuaian
        </button>
      </div>
    </main>
  );
}

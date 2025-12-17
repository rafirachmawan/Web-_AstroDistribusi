"use client";
import { useMemo, useState } from "react";

type JenisForm = "Pembelian Pabrik" | "Mutasi Antar Depo" | "Stock Awal";

type Item = {
  id: string;
  kode?: string;
  nama?: string;
  qtyL?: number;
  qtyM?: number;
  qtyS?: number;
  ed?: string; // yyyy-mm-dd
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

export default function InPage() {
  // ====== Header form state ======
  const [gudang, setGudang] = useState("Gudang A");
  const [jenisForm, setJenisForm] = useState<JenisForm>("Pembelian Pabrik");
  const [tanggal, setTanggal] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [kodeGudang, setKodeGudang] = useState("0001"); // placeholder auto
  const [kodeApos, setKodeApos] = useState("");
  const [principle, setPrinciple] = useState("");

  // ====== Items ======
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
        acc.L += it.qtyL || 0;
        acc.M += it.qtyM || 0;
        acc.S += it.qtyS || 0;
        return acc;
      },
      { L: 0, M: 0, S: 0 }
    );
  }, [items]);

  function onSubmit() {
    const payload = {
      header: { gudang, jenisForm, tanggal, kodeGudang, kodeApos, principle },
      items,
      totals,
    };
    console.log("SUBMIT IN:", payload);
    alert("(Demo) Data form dicetak ke console. Integrasi backend menyusul.");
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Transaksi Masuk (IN)
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
          <label className="text-xs font-medium text-slate-600">
            Jenis Form
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            value={jenisForm}
            onChange={(e) => setJenisForm(e.target.value as JenisForm)}
          >
            <option>Pembelian Pabrik</option>
            <option>Mutasi Antar Depo</option>
            <option>Stock Awal</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Tanggal Input
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Kode Gudang (auto)
          </label>
          <div className="flex gap-2">
            <input
              value={kodeGudang}
              onChange={(e) => setKodeGudang(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              placeholder="0001"
            />
            <button
              onClick={() =>
                setKodeGudang((n) =>
                  String(parseInt(n || "0") + 1).padStart(4, "0")
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              +1
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Kode Apos (manual)
          </label>
          <input
            value={kodeApos}
            onChange={(e) => setKodeApos(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            placeholder="APOS-2025-001"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Principle
          </label>
          <input
            value={principle}
            onChange={(e) => setPrinciple(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            placeholder="PT Contoh Abadi"
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
                {["Kode", "Nama", "L", "M", "S", "ED", "Catatan", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((it) => (
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
                      className="w-[320px] max-w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                      value={it.nama || ""}
                      placeholder="Nama Barang"
                      onChange={(e) =>
                        patchRow(it.id, { nama: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <NumberCell
                      value={it.qtyL}
                      onChange={(v) => patchRow(it.id, { qtyL: v })}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <NumberCell
                      value={it.qtyM}
                      onChange={(v) => patchRow(it.id, { qtyM: v })}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <NumberCell
                      value={it.qtyS}
                      onChange={(v) => patchRow(it.id, { qtyS: v })}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="w-40 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                      value={it.ed || ""}
                      onChange={(e) => patchRow(it.id, { ed: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-64 max-w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="text-slate-600">
            Total Item:{" "}
            <span className="font-semibold text-slate-800">{items.length}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-700">
            <div>
              L: <span className="tabular-nums font-semibold">{totals.L}</span>
            </div>
            <div>
              M: <span className="tabular-nums font-semibold">{totals.M}</span>
            </div>
            <div>
              S: <span className="tabular-nums font-semibold">{totals.S}</span>
            </div>
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
          Simpan Transaksi
        </button>
      </div>
    </main>
  );
}

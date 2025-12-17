"use client";
import { useMemo, useState } from "react";

type JenisOut = "Pengiriman (DR)" | "Return" | "Mutasi Keluar";
type TujuanType = "Customer" | "Gudang" | "Lainnya";

type Item = {
  id: string;
  kode?: string;
  nama?: string;
  qtyL?: number;
  qtyM?: number;
  qtyS?: number;
  ed?: string; // yyyy-mm-dd (opsional untuk kontrol FEFO)
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

export default function OutPage() {
  // ====== Header form state ======
  const [gudang, setGudang] = useState("Gudang A");
  const [jenis, setJenis] = useState<JenisOut>("Pengiriman (DR)");
  const [tanggal, setTanggal] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dokNo, setDokNo] = useState("");
  const [tujuanType, setTujuanType] = useState<TujuanType>("Customer");
  const [tujuanNama, setTujuanNama] = useState("");
  const [catatanHdr, setCatatanHdr] = useState("");

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

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          acc.L += it.qtyL || 0;
          acc.M += it.qtyM || 0;
          acc.S += it.qtyS || 0;
          return acc;
        },
        { L: 0, M: 0, S: 0 }
      ),
    [items]
  );

  function onSubmit() {
    const payload = {
      header: {
        gudang,
        jenis,
        tanggal,
        dokNo,
        tujuanType,
        tujuanNama,
        catatan: catatanHdr,
      },
      items,
      totals,
    };
    console.log("SUBMIT OUT:", payload);
    alert("(Demo) Data OUT dicetak ke console. Integrasi backend menyusul.");
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Transaksi Keluar (OUT)
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
            Jenis Transaksi
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisOut)}
          >
            <option>Pengiriman (DR)</option>
            <option>Return</option>
            <option>Mutasi Keluar</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Tanggal Transaksi
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
            Nomor Dokumen / DR
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            value={dokNo}
            onChange={(e) => setDokNo(e.target.value)}
            placeholder="DR-2025-0001"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Tujuan / Penerima
          </label>
          <div className="flex gap-2">
            <select
              className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              value={tujuanType}
              onChange={(e) => setTujuanType(e.target.value as TujuanType)}
            >
              <option>Customer</option>
              <option>Gudang</option>
              <option>Lainnya</option>
            </select>
            <input
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
              value={tujuanNama}
              onChange={(e) => setTujuanNama(e.target.value)}
              placeholder={
                tujuanType === "Customer"
                  ? "Nama Toko / Customer"
                  : tujuanType === "Gudang"
                  ? "Nama Gudang Tujuan"
                  : "Keterangan Tujuan"
              }
            />
          </div>
        </div>

        <div className="space-y-1 md:col-span-2 lg:col-span-1">
          <label className="text-xs font-medium text-slate-600">Catatan</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
            value={catatanHdr}
            onChange={(e) => setCatatanHdr(e.target.value)}
            placeholder="Catatan transaksi (optional)"
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

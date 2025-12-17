// ================= src/app/sales/offers/page.tsx =================
"use client";
import { useMemo, useState } from "react";
import CustomerPicker from "../../../component/CustomerPicker";

type Item = {
  id: string;
  code?: string;
  name?: string;
  qty?: number;
  price?: number;
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function OffersPage() {
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([{ id: uid() }]);

  function addRow() {
    setItems((s) => [...s, { id: uid() }]);
  }
  function removeRow(id: string) {
    setItems((s) => s.filter((x) => x.id !== id));
  }
  function patch(id: string, p: Partial<Item>) {
    setItems((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  const total = useMemo(
    () => items.reduce((a, it) => a + (it.qty || 0) * (it.price || 0), 0),
    [items]
  );

  function onSubmit() {
    if (!customerId) return alert("Pilih customer dulu");
    const payload = { customerId, items, total };
    console.log("SUBMIT OFFER:", payload);
    alert("(Demo) Offer dicetak ke console. Integrasi backend menyusul.");
  }

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Tawaran / PO
      </h1>

      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Customer
          </label>
          <CustomerPicker value={customerId} onChange={setCustomerId} />
        </div>
        <div className="lg:col-span-2" />
      </div>

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
                {["Kode", "Nama", "Qty", "Harga", "Subtotal", ""].map((h) => (
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
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2">
                    <input
                      className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      placeholder="BRG-001"
                      value={it.code || ""}
                      onChange={(e) => patch(it.id, { code: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-[320px] max-w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      placeholder="Nama Barang"
                      value={it.name || ""}
                      onChange={(e) => patch(it.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      placeholder="0"
                      value={(it.qty as any) || ""}
                      onChange={(e) =>
                        patch(it.id, { qty: Number(e.target.value || 0) })
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                      placeholder="0"
                      value={(it.price as any) || ""}
                      onChange={(e) =>
                        patch(it.id, { price: Number(e.target.value || 0) })
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-sm tabular-nums">
                    {((it.qty || 0) * (it.price || 0)).toLocaleString()}
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

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="text-slate-600">Total Item: {items.length}</div>
          <div className="text-right">
            <div className="text-slate-500">TOTAL</div>
            <div className="text-2xl font-bold tabular-nums text-slate-900">
              {total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Simpan Draft
        </button>
        <button
          onClick={onSubmit}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Simpan Offer
        </button>
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

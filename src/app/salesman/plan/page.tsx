// ================= src/app/sales/plan/page.tsx =================
"use client";
import { useState } from "react";
import SalesFilter from "../../../component/SalesFilter";
import CustomerPicker from "../../../component/CustomerPicker";
import Link from "next/link";

type Plan = {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  date: string;
  status: "Hari Ini" | "Besok" | "Selesai";
};
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: uid(),
      customerId: "c1",
      customerName: "Toko Sejahtera",
      address: "Jl. Melati 12",
      date: new Date().toISOString().slice(0, 10),
      status: "Hari Ini",
    },
    {
      id: uid(),
      customerId: "c2",
      customerName: "Warung Makmur",
      address: "Jl. Kenanga 8",
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      status: "Besok",
    },
  ]);
  const [newPlan, setNewPlan] = useState<{ customerId?: string; date: string }>(
    { date: new Date().toISOString().slice(0, 10) }
  );

  function addPlan() {
    if (!newPlan.customerId) return alert("Pilih customer dulu");
    const cust = (CustomerPicker as any).CUSTOMERS?.find?.(
      (c: any) => c.id === newPlan.customerId
    );
    const name = cust?.name || "Customer";
    const address = cust?.address || "-";
    setPlans((s) => [
      ...s,
      {
        id: uid(),
        customerId: newPlan.customerId!,
        customerName: name,
        address,
        date: newPlan.date,
        status:
          new Date(newPlan.date).toDateString() === new Date().toDateString()
            ? "Hari Ini"
            : "Besok",
      },
    ]);
  }

  function move(id: string, status: Plan["status"]) {
    setPlans((s) => s.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  const col = (status: Plan["status"]) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-700">{status}</div>
      <div className="grid gap-3">
        {plans
          .filter((p) => p.status === status)
          .map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 p-3 text-sm"
            >
              <div className="font-semibold text-slate-800">
                {p.customerName}
              </div>
              <div className="text-slate-500">{p.address}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => move(p.id, "Hari Ini")}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => move(p.id, "Besok")}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  Besok
                </button>
                <button
                  onClick={() => move(p.id, "Selesai")}
                  className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  Selesai
                </button>
                <Link
                  href={`/sales/kunjungan?cid=${p.customerId}`}
                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Visit
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Plan Kunjungan
      </h1>
      <SalesFilter />

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Customer
            </label>
            <CustomerPicker
              value={newPlan.customerId}
              onChange={(id) => setNewPlan((s) => ({ ...s, customerId: id }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Tanggal
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={newPlan.date}
              onChange={(e) =>
                setNewPlan((s) => ({ ...s, date: e.target.value }))
              }
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addPlan}
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Tambah Plan
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {col("Hari Ini")}
        {col("Besok")}
        {col("Selesai")}
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

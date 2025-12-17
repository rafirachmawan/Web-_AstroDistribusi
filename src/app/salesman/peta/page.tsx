// ================= src/app/sales/peta/page.tsx =================
"use client";
import SalesFilter from "../../../component/SalesFilter";

export default function PetaSalesPage() {
  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">Peta & Rute</h1>
      <SalesFilter />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-700">
          Map (placeholder)
        </div>
        <div className="h-[420px] w-full rounded-xl bg-[url('https://tile.openstreetmap.org/5/15/10.png')] bg-cover bg-center" />
        <div className="mt-2 text-xs text-slate-500">
          Integrasikan Leaflet/Mapbox untuk polyline rute & marker kunjungan.
        </div>
      </div>
    </main>
  );
}

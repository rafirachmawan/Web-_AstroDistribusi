// ================= src/app/sales/ringkasan/page.tsx =================
export default function RingkasanSalesPage() {
  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Ringkasan Sales
      </h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Kunjungan
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            12
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Hari ini</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Closing
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            4
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Hari ini</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Coverage
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            76%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Minggu ini</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Offer
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            7
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Open</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">
            Tren Kunjungan (placeholder)
          </h2>
          <div className="mt-3 h-56 rounded-xl bg-slate-100" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800">
            Win Rate (placeholder)
          </h2>
          <div className="mt-3 h-56 rounded-xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}

export default function MonitoringPage() {
  return (
    <main className="bg-slate-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-10 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Monitoring Leader (SITREP)
          </h1>
          <p className="mt-2 max-w-3xl text-white/90">
            Ringkasan harian/mingguan, KPI, peta aktivitas salesman, approval &
            komentar.
          </p>
        </div>
      </section>

      <section className="-mt-8 bg-slate-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="min-h-[340px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-800">
                Peta Aktivitas
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                (Placeholder) Integrasikan Mapbox/Leaflet di sini.
              </p>
            </div>
            <div className="grid gap-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">
                  KPI Hari Ini
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  <li>Kunjungan: 156</li>
                  <li>Closing: 42</li>
                  <li>Coverage: 78%</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">
                  Isu SITREP
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  (Placeholder) daftar isu + komentar/approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

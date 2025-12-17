// ================= src/app/hrd/page.tsx =================
import Link from "next/link";

function Card({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </Link>
  );
}

export default function HrdIndex() {
  return (
    <main className="bg-slate-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-10 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold sm:text-3xl">HRD</h1>
          <p className="mt-2 max-w-3xl text-white/90">
            Data karyawan, absensi, cuti/izin, penilaian, payroll, dan laporan.
          </p>
        </div>
      </section>

      <section className="-mt-8 bg-slate-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-2">
            <Card
              href="/hrd/karyawan"
              title="Data Karyawan"
              desc="Master data karyawan"
            />
            <Card
              href="/hrd/absensi"
              title="Absensi"
              desc="Check-in/out foto + GPS"
            />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card
              href="/hrd/cuti"
              title="Cuti/Izin"
              desc="Pengajuan & approval"
            />
            <Card
              href="/hrd/penilaian"
              title="Penilaian"
              desc="OKR/KPI sederhana"
            />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card
              href="/hrd/payroll"
              title="Payroll"
              desc="Gaji bulanan sederhana"
            />
            <Card
              href="/hrd/laporan"
              title="Laporan"
              desc="Rekap bulanan & ekspor"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

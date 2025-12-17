// ================= src/app/pelatihan/page.tsx =================
import Link from "next/link";
export default function PelatihanIndex() {
  return (
    <main className="bg-slate-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-10 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold sm:text-3xl">Pelatihan Karyawan</h1>
          <p className="mt-2 max-w-3xl text-white/90">
            Modul video, dokumen, kuis, progress, dan sertifikat otomatis.
          </p>
        </div>
      </section>
      <section className="-mt-8 bg-slate-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/pelatihan/katalog"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md text-slate-800 font-semibold"
            >
              Buka Katalog
            </Link>

            <Link
              href="/pelatihan/progress"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md text-slate-800 font-semibold"
            >
              Lihat Progress
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

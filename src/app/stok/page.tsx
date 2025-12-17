import Link from "next/link";

function CardLink({
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

export default function StokPage() {
  return (
    <main className="bg-slate-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-10 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Stok Gudang (Presisi)
          </h1>
          <p className="mt-2 max-w-3xl text-white/90">
            Dashboard stok, transaksi IN/OUT/Mutasi, FEFO/ED, penyesuaian, dan
            ekspor.
          </p>
        </div>
      </section>

      {/* Section konten latar terang */}
      <section className="-mt-8 bg-slate-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-2">
            <CardLink
              href="/stok/master-barang"
              title="Master Barang"
              desc="Kelola produk, kode, UOM L/M/S, dan principle."
            />
            <CardLink
              href="/stok/in"
              title="Transaksi Masuk (IN)"
              desc="Input pembelian, mutasi masuk, dan stock awal."
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <CardLink
              href="/stok/out"
              title="Transaksi Keluar (OUT)"
              desc="Pengiriman (DR), Return, Mutasi Keluar."
            />
            <CardLink
              href="/stok/mutasi"
              title="Mutasi Antar Gudang"
              desc="Pindahkan stok antar gudang secara atomik."
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <CardLink
              href="/stok/penyesuaian"
              title="Penyesuaian & Audit"
              desc="Opname, koreksi, dan audit trail."
            />
            <CardLink
              href="/stok/laporan"
              title="Laporan & Ekspor"
              desc="Excel/PDF untuk rekap stok, transaksi, dan ED/FEFO."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

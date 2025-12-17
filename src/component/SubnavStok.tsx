"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBNAV = [
  { href: "/stok/master-barang", label: "Master Barang" },
  { href: "/stok/in", label: "Transaksi Masuk (IN)" },
  { href: "/stok/out", label: "Transaksi Keluar (OUT)" },
  { href: "/stok/mutasi", label: "Mutasi" },
  { href: "/stok/penyesuaian", label: "Penyesuaian" },
  { href: "/stok/laporan", label: "Laporan & Ekspor" },
];

export default function SubnavStok() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {SUBNAV.map((i) => {
        const active = pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </div>
  );
}

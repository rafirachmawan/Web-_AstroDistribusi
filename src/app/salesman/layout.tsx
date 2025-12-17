// ================= src/app/salesman/layout.tsx =================
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/salesman/ringkasan", label: "Ringkasan" },
  { href: "/salesman/plan", label: "Plan" },
  { href: "/salesman/kunjungan", label: "Kunjungan" },
  { href: "/salesman/customers", label: "Customers" },
  { href: "/salesman/offers", label: "Offers" },
  { href: "/salesman/peta", label: "Peta" },
];

export default function SalesmanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap gap-2 py-3">
            {NAV.map((i) => {
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
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/monitoring/daily/checklist", label: "Checklist Area" },
  { href: "/monitoring/daily/evaluasi", label: "Evaluasi Tim" },
  { href: "/monitoring/daily/target", label: "Target & Achievement" },
  { href: "/monitoring/daily/project", label: "Project Tracking" },
  { href: "/monitoring/daily/agenda", label: "Agenda & Jadwal" },
  { href: "/monitoring/daily/achievement", label: "Achievement" },
  // ➕ NEW
  { href: "/monitoring/daily/rekap", label: "Rekap & TTD" },
];

export default function DailyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="bg-slate-50">
      {/* Header banner ala sheet */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 py-6 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center rounded-full bg-white/10 text-xl font-bold">
              L
            </div>
            <div>
              <div className="text-lg font-bold uppercase tracking-wide">
                Leader Monitoring Daily
              </div>
              <div className="text-xs text-white/80">
                Leader: [auto-fill] · Tanggal: [auto-fill] · Depo: [auto-fill]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap gap-2 py-3">
            {TABS.map((t) => {
              const active = pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {t.label}
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

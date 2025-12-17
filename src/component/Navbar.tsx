import Link from "next/link";
import NavbarClient from "./NavbarClient";
import { getSessionAndProfile } from "@/lib/getProfile";
import type { AppModule } from "@/lib/authz";

const LINKS: Array<{ href: string; label: string; module?: AppModule }> = [
  { href: "/", label: "Beranda" },
  { href: "/stok", label: "Stok Presisi", module: "stok" },
  { href: "/monitoring", label: "Monitoring Leader", module: "monitoring" },
  { href: "/salesman", label: "BE to BE Salesman", module: "salesman" },
  { href: "/pelatihan", label: "Pelatihan", module: "pelatihan" },
  { href: "/hrd", label: "HRD", module: "hrd" },
];

export default async function Navbar() {
  const { session, profile } = await getSessionAndProfile();
  const displayName = profile?.full_name ?? "Guest";
  const role = profile?.role ?? null;
  const modules = (profile?.module_access ?? []) as string[];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Brand (nama user) */}
          <Link href="/" className="text-sm font-semibold text-slate-800">
            {displayName}
          </Link>

          <NavbarClient
            links={LINKS}
            role={role}
            modules={modules}
            isAuthed={!!session}
          />
        </div>
      </div>
    </header>
  );
}

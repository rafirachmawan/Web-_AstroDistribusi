import { NextResponse } from "next/server";
import { getSessionAndProfile } from "@/lib/getProfile";
import { can } from "@/lib/authz";

type Mod = "stok" | "monitoring" | "salesman" | "pelatihan" | "hrd";
type LinkBase = { href: string; label: string };
type LinkGuarded = LinkBase & { mod?: Mod };

const ALL: LinkGuarded[] = [
  { href: "/", label: "Beranda" },
  { href: "/stok", label: "Stok Presisi", mod: "stok" },
  { href: "/monitoring", label: "Monitoring Leader", mod: "monitoring" },
  { href: "/salesman", label: "BE to BE Salesman", mod: "salesman" },
  { href: "/pelatihan", label: "Pelatihan", mod: "pelatihan" },
  { href: "/hrd", label: "HRD", mod: "hrd" },
];

export async function GET() {
  const { session, profile } = await getSessionAndProfile();

  const links: LinkBase[] = session
    ? ALL.filter((l) => {
        const mod = l.mod as Mod | undefined; // ← narrow aman
        return !mod || can(profile as any, mod);
      }).map(({ href, label }) => ({ href, label }))
    : ALL.filter((l) => l.href === "/").map(({ href, label }) => ({
        href,
        label,
      }));

  return NextResponse.json({ links });
}

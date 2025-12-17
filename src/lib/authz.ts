// RBAC helper: mapping path -> module & pemeriksaan akses
import type { ProfileRow } from "@/lib/getProfile";

export type AppModule =
  | "stok"
  | "monitoring"
  | "salesman"
  | "pelatihan"
  | "hrd";

export function pathToModule(pathname: string): AppModule | null {
  const p = pathname.split("?")[0];
  if (p.startsWith("/stok")) return "stok";
  if (p.startsWith("/monitoring")) return "monitoring";
  if (p.startsWith("/salesman")) return "salesman";
  if (p.startsWith("/pelatihan")) return "pelatihan";
  if (p.startsWith("/hrd")) return "hrd";
  return null;
}

// Aturan umum:
// - admin, hr, ops => akses semua modul (ini meng-cover: Rafi/IT, Erika/HR, Owner (ops/admin))
// - selain itu, hanya modul yang ada di profile.module_access
export function can(profile: ProfileRow | null, mod: AppModule): boolean {
  if (!profile) return false;
  if (["admin", "hr", "ops"].includes(profile.role)) return true;
  return !!profile.module_access?.includes(mod);
}

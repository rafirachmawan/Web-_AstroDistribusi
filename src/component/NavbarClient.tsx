"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { can, type AppModule } from "@/lib/authz";
import { supabaseBrowser } from "@/lib/supabase/client";

type LinkItem = { href: string; label: string; module?: AppModule };

export default function NavbarClient({
  links,
  role,
  modules,
  isAuthed,
}: {
  links: LinkItem[];
  role: string | null;
  modules: string[];
  isAuthed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function allowed(mod?: AppModule) {
    if (!mod) return true; // Beranda selalu boleh
    // Bentuk object profile minimal untuk helper can()
    const profile = { role: role || "", module_access: modules } as any;
    return can(profile, mod);
  }

  async function logout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    // hard redirect agar cookie middleware juga bersih
    window.location.replace("/login");
  }

  return (
    <nav className="flex items-center gap-2">
      {links.map((l) => {
        const act =
          pathname === l.href ||
          (l.href !== "/" && pathname.startsWith(l.href));
        const ok = allowed(l.module);

        const cls =
          "rounded-xl px-3 py-1.5 text-sm font-medium transition " +
          (act
            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
            : ok
            ? "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            : "text-slate-400 hover:bg-slate-50 cursor-not-allowed");

        return ok ? (
          <Link key={l.href} href={l.href} className={cls}>
            {l.label}
          </Link>
        ) : (
          <button
            key={l.href}
            onClick={() => router.push("/403")}
            className={cls}
            type="button"
            aria-disabled
          >
            {l.label}
          </button>
        );
      })}

      {isAuthed && (
        <button
          onClick={logout}
          className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Logout
        </button>
      )}
    </nav>
  );
}

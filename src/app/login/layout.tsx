// src/app/login/layout.tsx
import Link from "next/link";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* LOGIN NAVBAR - stylish, ringan, tanpa menu modul/user */}
      <header className="sticky top-0 z-50">
        {/* hairline gradient di paling atas */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="container mx-auto max-w-6xl px-4">
          {/* glass box */}
          <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 shadow-[0_7px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between">
              {/* Brand */}
              <Link href="/" className="group inline-flex items-center gap-3">
                {/* avatar inisial brand */}
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-[13px] font-bold text-white ring-1 ring-white/30">
                  A
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                    Astro Distribusi
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Portal Terpadu
                  </span>
                </span>
              </Link>

              {/* Links kecil (informasi) */}
              <nav className="hidden items-center gap-1 sm:flex">
                <a
                  href="#"
                  className="relative rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Tentang
                </a>
                <a
                  href="#"
                  className="relative rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Bantuan
                </a>
                <a
                  href="#"
                  className="relative rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Kebijakan
                </a>
                {/* Status chip */}
                <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
                  Secure • SSL
                </span>
              </nav>

              {/* Mobile: tombol bantuan sederhana */}
              <button className="sm:hidden rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Bantuan
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Konten halaman login */}
      <div className="container mx-auto max-w-6xl px-4">{children}</div>
    </div>
  );
}

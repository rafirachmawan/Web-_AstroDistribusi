"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Package,
  BarChart3,
  Smartphone,
  Users,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const params = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = supabaseBrowser();

    try {
      if (isRegister) {
        const {
          data: { user, session },
          error,
        } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // profil default
        if (user?.id) {
          await supabase
            .from("profiles")
            .upsert(
              {
                user_id: user.id,
                full_name: fullName || email,
                role_key: "salesman",
              },
              { onConflict: "user_id" }
            );
        }

        // kalau project-mu require confirm email, session bisa null → login lagi
        if (!session) {
          await supabase.auth.signInWithPassword({ email, password });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      // bantu flush cookie sb:* ke browser
      await supabase.auth.getSession();

      const to = params.get("redirectedFrom") || "/";
      window.location.replace(to); // hard redirect biar SSR/middleware baca cookie baru
    } catch (err: any) {
      alert(err?.message ?? "Gagal memproses. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-[calc(100vh-0px)] w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-2">
        {/* LEFT */}
        <section className="relative hidden overflow-hidden rounded-3xl p-8 text-white shadow-lg lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700" />
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              Astro Distribusi{" "}
              <span className="rounded-full bg-white/15 px-2 py-0.5">
                Platform
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight">
              Selamat datang kembali 👋
            </h1>
            <p className="mt-3 max-w-md text-white/90">
              Akses cepat ke Stok Presisi, Monitoring Leader, Salesman,
              Pelatihan, dan HRD.
            </p>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3">
            {[
              { icon: Package, label: "Stok Presisi" },
              { icon: BarChart3, label: "Monitoring" },
              { icon: Smartphone, label: "Salesman" },
              { icon: Users, label: "HRD" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-3 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 backdrop-blur-sm"
              >
                <div className="rounded-xl bg-white/20 p-2">
                  <m.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-semibold">{m.label}</div>
              </div>
            ))}
          </div>

          <ul className="relative mt-6 space-y-2 text-white/95">
            {[
              "Single Sign-On ke semua modul",
              "Realtime data",
              "Akses sesuai role & modul",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* RIGHT — form */}
        <section className="grid place-items-center">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              {isRegister ? "Daftar Akun" : "Masuk"}
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Gunakan akun perusahaan Anda untuk{" "}
              {isRegister ? "mendaftar" : "masuk"}.
            </p>

            {isRegister && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Nama Lengkap
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="cth: Pak Rafi"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="email@contoh.com"
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={
                    showPwd ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
            </button>

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsRegister((v) => !v)}
                className="text-blue-700 hover:underline"
              >
                {isRegister
                  ? "Sudah punya akun? Masuk"
                  : "Belum punya akun? Daftar"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

"use client";

import {
  Package,
  BarChart3,
  Smartphone,
  GraduationCap,
  Users,
  Globe2,
  TrendingUp,
} from "lucide-react";
import React from "react";

/* ====== Small UI helpers ====== */
function PlatformPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-100">
      {label}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  platform,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  platform: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <Icon className="h-6 w-6 text-slate-700" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-slate-600">{desc}</p>
          <div className="mt-3">
            <PlatformPill label={platform} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
}: {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-bold tabular-nums text-slate-900">
          {value}
        </div>
        {delta !== undefined && (
          <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-100">
            <TrendingUp className="h-3 w-3" aria-hidden /> {delta}
          </div>
        )}
      </div>
      {deltaLabel && (
        <div className="mt-1 text-[11px] text-slate-500">{deltaLabel}</div>
      )}
    </div>
  );
}

export default function HomeLanding() {
  const features = [
    {
      icon: Package,
      title: "Aplikasi Gudang",
      desc: "Input barang masuk/keluar, melihat stok multi-gudang, FEFO/ED, mutasi & penyesuaian, ekspor laporan.",
      platform: "Web + Mobile",
    },
    {
      icon: BarChart3,
      title: "Website Monitoring",
      desc: "Laporan harian untuk Leader: ringkasan KPI, peta aktivitas, approval & komentar.",
      platform: "Web",
    },
    {
      icon: Smartphone,
      title: "Aplikasi Be To Be Salesman",
      desc: "Tracking rute & geolokasi, callplan/visit, penawaran produk multi-item, foto & hasil kunjungan.",
      platform: "Mobile + Web",
    },
    {
      icon: GraduationCap,
      title: "Pelatihan Karyawan Baru",
      desc: "SOP kantor, video pembelajaran, kuis & sertifikat PDF per role.",
      platform: "Web",
    },
    {
      icon: Users,
      title: "HRD",
      desc: "Data karyawan, absensi foto+GPS, cuti/izin, evaluasi & laporan HR.",
      platform: "Web",
    },
  ];

  const stats = [
    {
      label: "Total Stok Barang",
      value: "12,453",
      delta: "+1,234",
      deltaLabel: "dari minggu ini",
    },
    {
      label: "Salesman Aktif",
      value: 48,
      delta: "+5",
      deltaLabel: "online sekarang",
    },
    { label: "Kunjungan Hari Ini", value: 156 },
    {
      label: "Total Karyawan",
      value: 127,
      delta: "+13",
      deltaLabel: "karyawan baru",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 pb-16 pt-10 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20">
              <Globe2 className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
              Astro Distribusi
            </h1>
          </div>
          <p className="mt-3 max-w-3xl text-sm/6 md:text-base/7 text-white/90">
            Sistem terintegrasi untuk Manajemen Distribusi, Sales, dan
            Operasional Perusahaan.
          </p>

          {/* Ribbon */}
          <div className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-[13px] font-semibold text-white shadow-sm ring-1 ring-white/10">
            Semua Sistem Dikumpulkan dalam 1 Database Terpusat
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="-mt-10 pb-6">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-2">
            {features.slice(0, 2).map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {features.slice(2, 4).map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FeatureCard {...features[4]} />
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                delta={s.delta}
                deltaLabel={s.deltaLabel}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import SubnavStok from "../component/SubnavStok";

export default function StokShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <SubnavStok />
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-4">{children}</div>
    </div>
  );
}

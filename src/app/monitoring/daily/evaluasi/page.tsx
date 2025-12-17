"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ROLES = [
  { key: "kepala_admin", label: "Kepala Admin" },
  { key: "kepala_gudang", label: "Kepala Gudang" },
  { key: "spv", label: "SPV" },
  { key: "sales_manager", label: "Sales Manager" },
  { key: "bsdc", label: "BSDC" },
  { key: "hrd", label: "HRD" },
  { key: "direktur", label: "Direktur" },
  { key: "it", label: "IT" },
];

export default function EvaluasiIndexPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [role, setRole] = useState<string>(sp.get("role") || "kepala_admin");
  const date = sp.get("date") || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    router.replace(`/monitoring/daily/evaluasi/${role}?date=${date}`);
  }, [role, date, router]);

  return (
    <main className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-lg font-semibold mb-3">Evaluasi Tim</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            Mengarahkan ke template per role…
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </main>
  );
}

"use client";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export function scoreColor(n?: number) {
  if (!n || n < 1.5) return "ring-1 ring-rose-200 bg-rose-50 text-rose-700";
  if (n < 3.5) return "ring-1 ring-amber-200 bg-amber-50 text-amber-700";
  return "ring-1 ring-emerald-200 bg-emerald-50 text-emerald-700";
}

export function ScorePill({ n }: { n?: number }) {
  const cls = scoreColor(n);
  const Icon = !n || n < 1.5 ? XCircle : n < 3.5 ? AlertTriangle : CheckCircle2;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {n ?? "-"}
    </span>
  );
}

const STATUS = ["Completed", "On Track", "At Risk", "Blocked"] as const;
export type Status = (typeof STATUS)[number];

export function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: Status) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-black focus:ring-2 focus:ring-blue-500"
    >
      {STATUS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

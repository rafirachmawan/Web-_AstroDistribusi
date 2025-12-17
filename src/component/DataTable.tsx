// ================= src/components/DataTable.tsx =================
"use client";
import React from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                    c.className ?? ""
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                {columns.map((c) => (
                  <td
                    key={String(c.key)}
                    className={`px-4 py-3 text-sm text-slate-700 ${
                      c.className ?? ""
                    }`}
                  >
                    {c.render
                      ? c.render(row)
                      : String(row[c.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

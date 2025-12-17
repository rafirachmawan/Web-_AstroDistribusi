// ================= src/app/hrd/laporan/page.tsx =================
"use client";
import { useState } from "react";
import InputBlack from "../../../component/hrd/InputBlack";

function toCSV(rows: any[], headers: string[]): string {
  const escape = (v: any) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const head = headers.map(escape).join(",");
  const body = rows
    .map((r) => headers.map((h) => escape((r as any)[h])).join(","))
    .join("\n");
  return head + "\n" + body;
}
function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanPage() {
  const [month, setMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );

  const contohAbsensi = [
    {
      tanggal: month + "-01",
      nip: "EMP-0001",
      nama: "Andi",
      tipe: "IN",
      lat: -6.2,
      lng: 106.8,
    },
    {
      tanggal: month + "-01",
      nip: "EMP-0001",
      nama: "Andi",
      tipe: "OUT",
      lat: -6.2,
      lng: 106.8,
    },
  ];
  const contohCuti = [
    {
      nip: "EMP-0002",
      nama: "Budi",
      jenis: "Cuti",
      dari: month + "-10",
      sampai: month + "-12",
    },
  ];
  const contohPayroll = [
    { nip: "EMP-0001", nama: "Andi", thp: 4900000 },
    { nip: "EMP-0002", nama: "Budi", thp: 6750000 },
  ];

  function exportAbsensi() {
    const csv = toCSV(contohAbsensi, [
      "tanggal",
      "nip",
      "nama",
      "tipe",
      "lat",
      "lng",
    ]);
    downloadCSV(`rekap-absensi-${month}.csv`, csv);
  }
  function exportCuti() {
    const csv = toCSV(contohCuti, ["nip", "nama", "jenis", "dari", "sampai"]);
    downloadCSV(`rekap-cuti-${month}.csv`, csv);
  }
  function exportPayroll() {
    const csv = toCSV(contohPayroll, ["nip", "nama", "thp"]);
    downloadCSV(`rekap-payroll-${month}.csv`, csv);
  }

  return (
    <main className="bg-slate-50 pb-16 input-black">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Laporan & Ekspor
      </h1>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Periode (YYYY-MM)
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">
            Rekap Absensi
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Export CSV daftar check-in/out per tanggal.
          </p>
          <button
            onClick={exportAbsensi}
            className="mt-3 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">
            Rekap Cuti/Izin
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Export CSV pengajuan cuti/izin.
          </p>
          <button
            onClick={exportCuti}
            className="mt-3 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">
            Rekap Payroll
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Export CSV take home pay per karyawan.
          </p>
          <button
            onClick={exportPayroll}
            className="mt-3 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>
    </main>
  );
}

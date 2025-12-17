"use client";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

type Tipe = "ALL" | "IN" | "OUT" | "MUTASI" | "ADJ";

type Row = {
  tanggal: string; // yyyy-mm-dd
  tipe: Exclude<Tipe, "ALL">;
  dokNo: string;
  gudang: string; // untuk IN/OUT/ADJ
  asal?: string; // khusus MUTASI
  tujuan?: string; // khusus MUTASI
  kode: string;
  nama: string;
  L: number;
  M: number;
  S: number;
};

// --- DEMO data (ganti nanti dengan fetch dari DB) ---
const DEMO: Row[] = [
  {
    tanggal: "2025-10-03",
    tipe: "IN",
    dokNo: "PO-0001",
    gudang: "Gudang A",
    kode: "BRG-001",
    nama: "Produk A",
    L: 10,
    M: 0,
    S: 5,
  },
  {
    tanggal: "2025-10-03",
    tipe: "OUT",
    dokNo: "DR-0001",
    gudang: "Gudang A",
    kode: "BRG-001",
    nama: "Produk A",
    L: 2,
    M: 0,
    S: 1,
  },
  {
    tanggal: "2025-10-03",
    tipe: "MUTASI",
    dokNo: "MTS-0001",
    gudang: "Gudang B",
    asal: "Gudang A",
    tujuan: "Gudang B",
    kode: "BRG-002",
    nama: "Produk B",
    L: 0,
    M: 4,
    S: 0,
  },
  {
    tanggal: "2025-10-02",
    tipe: "ADJ",
    dokNo: "ADJ-0002",
    gudang: "Gudang C",
    kode: "BRG-003",
    nama: "Produk C",
    L: -1,
    M: 0,
    S: 0,
  },
  {
    tanggal: "2025-10-01",
    tipe: "IN",
    dokNo: "PO-0002",
    gudang: "Gudang B",
    kode: "BRG-004",
    nama: "Produk D",
    L: 0,
    M: 6,
    S: 0,
  },
];

function toCSV(rows: any[], filename = "laporan.csv") {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanPage() {
  // Filter
  const [gudang, setGudang] = useState<string>("ALL");
  const [tipe, setTipe] = useState<Tipe>("ALL");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState("");

  const filtered: Row[] = useMemo(() => {
    let rows = DEMO.slice();

    if (gudang !== "ALL")
      rows = rows.filter(
        (r) => r.gudang === gudang || r.asal === gudang || r.tujuan === gudang
      );
    if (tipe !== "ALL") rows = rows.filter((r) => r.tipe === tipe);
    if (from) rows = rows.filter((r) => r.tanggal >= from);
    if (to) rows = rows.filter((r) => r.tanggal <= to);

    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.kode.toLowerCase().includes(s) ||
          r.nama.toLowerCase().includes(s) ||
          r.dokNo.toLowerCase().includes(s)
      );
    }

    // urutkan terbaru dulu
    rows.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
    return rows;
  }, [gudang, tipe, from, to, q]);

  const total = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          acc.L += r.L || 0;
          acc.M += r.M || 0;
          acc.S += r.S || 0;
          return acc;
        },
        { L: 0, M: 0, S: 0 }
      ),
    [filtered]
  );

  function exportXLSX() {
    const table = document.getElementById(
      "reportTable"
    ) as HTMLTableElement | null;
    if (!table || filtered.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const wb = XLSX.utils.table_to_book(table, { sheet: "Laporan" });
    XLSX.writeFile(wb, "laporan-stok.xlsx");
  }

  function exportCSV() {
    if (filtered.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    toCSV(filtered, "laporan-stok.csv");
  }

  function printPDF() {
    // cukup gunakan dialog print browser → Save as PDF
    window.print();
  }

  return (
    <main className="bg-slate-50 pb-16">
      <h1 className="mb-4 text-lg font-semibold text-slate-800">
        Laporan & Ekspor
      </h1>

      {/* Filter Bar */}
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
        <input
          type="text"
          placeholder="Cari dokumen/kode/nama…"
          className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
          value={gudang}
          onChange={(e) => setGudang(e.target.value)}
        >
          {[
            "ALL",
            "Gudang A",
            "Gudang B",
            "Gudang C",
            "Gudang D",
            "Gudang E",
          ].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
          value={tipe}
          onChange={(e) => setTipe(e.target.value as Tipe)}
        >
          {["ALL", "IN", "OUT", "MUTASI", "ADJ"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="mb-3 flex flex-wrap gap-3">
        <button
          onClick={exportXLSX}
          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
        >
          Export Excel (XLSX)
        </button>
        <button
          onClick={exportCSV}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Export CSV
        </button>
        <button
          onClick={printPDF}
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
        >
          Cetak (Save as PDF)
        </button>
      </div>

      {/* Report Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-700">
            Rekap Transaksi ({filtered.length} baris)
          </div>
          <div className="text-xs text-slate-500">
            Total L/M/S:{" "}
            <span className="font-semibold text-slate-700">
              {total.L}/{total.M}/{total.S}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            id="reportTable"
            className="min-w-full divide-y divide-slate-200"
          >
            <thead className="bg-white">
              <tr>
                {[
                  "Tanggal",
                  "Tipe",
                  "Dokumen",
                  "Gudang/Asal→Tujuan",
                  "Kode",
                  "Nama",
                  "L",
                  "M",
                  "S",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {filtered.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2">{r.tanggal}</td>
                  <td className="px-4 py-2">{r.tipe}</td>
                  <td className="px-4 py-2">{r.dokNo}</td>
                  <td className="px-4 py-2">
                    {r.tipe === "MUTASI" ? `${r.asal} → ${r.tujuan}` : r.gudang}
                  </td>
                  <td className="px-4 py-2">{r.kode}</td>
                  <td className="px-4 py-2">{r.nama}</td>
                  <td className="px-4 py-2 tabular-nums">{r.L}</td>
                  <td className="px-4 py-2 tabular-nums">{r.M}</td>
                  <td className="px-4 py-2 tabular-nums">{r.S}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                  colSpan={6}
                >
                  Total
                </td>
                <td className="px-4 py-2 text-sm font-semibold tabular-nums">
                  {total.L}
                </td>
                <td className="px-4 py-2 text-sm font-semibold tabular-nums">
                  {total.M}
                </td>
                <td className="px-4 py-2 text-sm font-semibold tabular-nums">
                  {total.S}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </main>
  );
}

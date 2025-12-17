"use client";

import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  LockKeyhole,
  Unlock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  CalendarDays,
  Shield,
} from "lucide-react";

/* ===================== Types ===================== */
type FieldBase = {
  id: string;
  label: string;
  help?: string;
  idx?: number;
  section_id?: string;
  group_key?: string | null;
  group_label?: string | null;
  group_order?: number | null;
};
type FieldRadio = FieldBase & { type: "radio"; options: string[] };
type FieldCheckbox = FieldBase & { type: "checkbox"; options: string[] };
type FieldNumber = FieldBase & {
  type: "number";
  suffix?: string;
  min?: number;
  max?: number;
};
type FieldText = FieldBase & { type: "text"; placeholder?: string };
type FieldCurrency = FieldBase & { type: "currency"; placeholder?: string };
type FieldInvoice = FieldBase & { type: "invoice" };
type FieldImage = FieldBase & { type: "image" }; // upload foto
type FieldCycleTable = FieldBase & { type: "cycle_table" }; // ⬅️ NEW

type Field =
  | FieldRadio
  | FieldCheckbox
  | FieldNumber
  | FieldText
  | FieldCurrency
  | FieldInvoice
  | FieldImage
  | FieldCycleTable; // ⬅️ NEW

export type ChecklistSection = {
  id: string;
  title: string;
  idx?: number;
  period?: "daily" | "weekly" | "monthly";
  fields: Field[];
  // ⬇️ NEW: daftar tanggal (YYYY-MM-DD) ketika section ini dibuka (KHUSUS weekly)
  weekly_open?: string[];
};

type Period = "daily" | "weekly" | "monthly";

/** tipe aman untuk part combo */
type ComboKind = "radio" | "checkbox" | "number" | "text" | "currency";

/* ===================== Consts ===================== */
const SUPER_BASE = "/api/super-admin";
const SECTION_BASE = "/api/monitoring/daily/sections";
const FIELDS_API = "/api/monitoring/daily/fields";
const FORM_API = "/api/monitoring/daily/forms";
const SCHEDULES_API = "/api/monitoring/daily/schedules";

/* ===================== Utils ===================== */
const formatCurrency = (n: number | string) => {
  const num =
    typeof n === "string" ? Number(n.replace(/[^\d.-]/g, "")) : Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("id-ID");
};
const uid = () => Math.random().toString(36).slice(2, 10);

// Supabase client untuk upload foto
const supabase = createClientComponentClient();

const isMultiNumber = (f: Field) =>
  f.type === "number" &&
  ((f as any).suffix?.toLowerCase().includes("faktur+") ||
    (f.label || "").toLowerCase().includes("jumlah faktur"));

const isMultiCurrency = (f: Field) =>
  f.type === "currency" &&
  ((f as any).placeholder?.toLowerCase().includes("faktur+") ||
    (f.label || "").toLowerCase().includes("jumlah faktur"));

const isMultiText = (f: Field) =>
  f.type === "text" &&
  ((f as any).placeholder || "").toLowerCase().includes("multi+");

const isMultiField = (f: Field) =>
  isMultiNumber(f) || isMultiCurrency(f) || isMultiText(f);

// Title Case sederhana (tahan spasi ganda & tanda hubung)
function titleCase(input: string): string {
  if (!input) return "";
  const cap = (w: string) =>
    w ? w[0].toLocaleUpperCase("id-ID") + w.slice(1) : "";
  return input
    .toLocaleLowerCase("id-ID")
    .split(/\s+/) // pisah per spasi
    .map((word) => word.split("-").map(cap).join("-")) // "tulungagung-kota"
    .join(" ");
}

function asOptions(f: any): string[] {
  const raw = f?.options;
  if (!raw) return [];

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      return raw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (typeof raw === "object" && Array.isArray((raw as any).options)) {
    return (raw as any).options.filter(Boolean).map(String);
  }
  return [];
}

// === PO Delay detector: treat as special JSON list ===
const isPoDelay = (f: any) => {
  const mark = String(f?.placeholder ?? f?.label ?? "");
  return (
    /po[-\s]?delay/i.test(mark) || // "PO Delay"
    /po.*belum.*datang/i.test(mark) // "PO yang belum datang ..."
  );
};

const isCycleTable = (f: any) =>
  String(f?.type ?? "").toLowerCase() === "cycle_table";
const isImageField = (f: any) =>
  String(f?.type ?? "").toLowerCase() === "image";

// Field "daftar" untuk model cetak (pakai text multi+)
const normDate = (s: string) => String(s || "").slice(0, 10);
const dateStrToInt = (s: string) => Number(normDate(s).replace(/-/g, "") || 0);
const anyToYMD = (v: any) => {
  const s = String(v || "");
  if (/^\d{8}$/.test(s))
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return normDate(s);
};

// bikin form kosong dari daftar sections
function buildEmptyFormFromSections(sections: ChecklistSection[]) {
  const init: Record<string, Record<string, any>> = {};
  for (const s of sections) {
    init[s.id] = {};
    for (const f of s.fields ?? []) {
      const t = String((f as any).type || "");

      if (t.includes("+")) {
        init[s.id][(f as any).id] = { note: "" };
      } else if (t === "invoice") {
        init[s.id][(f as any).id] = [];
      } else if (isPoDelay(f)) {
        init[s.id][(f as any).id] = [];
      } else if (isCycleTable(f)) {
        // cycle_table disimpan sebagai STRING (encode baris)
        init[s.id][(f as any).id] = "";
      } else if (isImageField(f)) {
        // image simpan URL string
        init[s.id][(f as any).id] = "";
      } else if (isMultiField(f)) {
        init[s.id][(f as any).id] = [];
      } else if (t === "checkbox") {
        init[s.id][(f as any).id] = [];
      } else if (t === "number" || t === "currency") {
        init[s.id][(f as any).id] = 0;
      } else {
        init[s.id][(f as any).id] = "";
      }
    }
  }
  return init;
}

/* ===================== Minor Components ===================== */
function SuperAdminToggle({
  active,
  busy,
  onEnable,
  onDisable,
}: {
  active: boolean;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  if (!active) {
    return (
      <button
        onClick={onEnable}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 no-print"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LockKeyhole className="h-4 w-4" />
        )}
        Mode Super Admin
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 no-print">
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <Unlock className="h-3 w-3" /> Aktif
      </span>
      <button
        onClick={onDisable}
        disabled={busy}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        Keluar Mode
      </button>
    </div>
  );
}

/* ===================== Field Input ===================== */
function FieldInput({
  secId,
  f,
  val,
  setVal,
  canDesign,
  onEdit,
  onDelete,
  hideLabel = false,
  disabled = false,
}: {
  secId: string;
  f: Field;
  val: any;
  setVal: (s: string, fid: string, v: any) => void;
  canDesign: boolean;
  onEdit: () => void;
  onDelete: () => void;
  hideLabel?: boolean;
  disabled?: boolean;
}) {
  if (!f) return null;

  const fid = (f as any)?.id || f.id;
  const muted = disabled ? "opacity-60 pointer-events-none" : "";

  // ---------- IMAGE: upload foto ----------
  if ((f as any).type === "image") {
    const url: string = typeof val === "string" ? val : "";

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const filePath = `checklist/${fid}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("monitoring-photos")
        .upload(filePath, file);

      console.log("UPLOAD RESULT:", { data, error });

      if (error) {
        alert("Gagal upload foto: " + error.message);
        return;
      }

      const publicUrlData = supabase.storage
        .from("monitoring-photos")
        .getPublicUrl(filePath);

      const url = publicUrlData?.data?.publicUrl;
      setVal(secId, fid, url);
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {!hideLabel && (
            <label className="text-sm font-medium text-black">
              {f.label}
              {(f as any).help && (
                <span className="ml-2 text-xs text-black/60">
                  {(f as any).help}
                </span>
              )}
            </label>
          )}
          {canDesign && (
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={onEdit}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
                title="Edit field"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
                title="Hapus field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Preview foto */}
        {url && (
          <div className="max-w-xs">
            <img
              src={url}
              alt={f.label}
              className="max-h-64 w-auto rounded-lg border border-slate-200 object-contain"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={handleFileChange}
          className={`block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700 ${
            disabled ? "opacity-60" : ""
          }`}
        />

        {url && (
          <div className="text-[10px] text-slate-500 break-all">
            URL: <span className="underline">{url}</span>
          </div>
        )}
      </div>
    );
  }

  // ---------- CYCLE TABLE: Penugasan Cycle Count (Gudang / PIC / Principal) ----------
  if ((f as any).type === "cycle_table") {
    type Row = { gudang: string; pic: string; principal: string };

    const raw: string = typeof val === "string" ? val : "";

    // parsing string -> { rows, deadline }
    const parseValue = (rawVal: string): { rows: Row[]; deadline: string } => {
      if (!rawVal) {
        return {
          rows: [{ gudang: "", pic: "", principal: "" }],
          deadline: "",
        };
      }

      const lines = rawVal
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const rows: Row[] = [];
      let deadline = "";

      for (const line of lines) {
        const match = line.match(/deadline laporan jam\s*:\s*(\d{2}:\d{2})/i);
        if (match) {
          deadline = match[1];
        } else {
          const [gudang = "", pic = "", principal = ""] = line
            .split("|")
            .map((x) => x.trim());
          rows.push({ gudang, pic, principal });
        }
      }

      if (rows.length === 0) {
        rows.push({ gudang: "", pic: "", principal: "" });
      }

      return { rows, deadline };
    };

    const { rows, deadline } = parseValue(raw);

    const encodeValue = (rowsVal: Row[], deadlineVal: string) => {
      // JANGAN di-filter, simpan semua baris (termasuk yang masih kosong)
      const lineRows = rowsVal.map(
        (r) => `${r.gudang ?? ""} | ${r.pic ?? ""} | ${r.principal ?? ""}`
      );

      const lines = [...lineRows];

      if (deadlineVal) {
        lines.push(`Deadline Laporan Jam : ${deadlineVal}`);
      }

      return lines.join("\n");
    };

    const handleRowsChange = (nextRows: Row[], nextDeadline: string) => {
      const encoded = encodeValue(nextRows, nextDeadline);
      setVal(secId, fid, encoded);
    };

    const updateRow = (idx: number, patch: Partial<Row>) => {
      const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
      handleRowsChange(next, deadline);
    };

    const addRow = () => {
      if (disabled) return;
      const next = [...rows, { gudang: "", pic: "", principal: "" }];
      handleRowsChange(next, deadline);
    };

    const removeRow = (idx: number) => {
      if (disabled) return;
      const next = rows.filter((_, i) => i !== idx);
      handleRowsChange(next, deadline);
    };

    return (
      <div className="flex flex-col gap-2">
        {/* Header label + tombol edit/hapus */}
        <div className="flex items-center justify-between">
          {!hideLabel && (
            <label className="text-sm font-medium text-black">
              {f.label}
              {(f as any).help && (
                <span className="ml-2 text-xs text-black/60">
                  {(f as any).help}
                </span>
              )}
            </label>
          )}
          {canDesign && (
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={onEdit}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
                title="Edit field"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
                title="Hapus field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Tabel Penugasan */}
        <div
          className={`overflow-x-auto rounded-xl border border-slate-300 ${
            disabled ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1 w-1/3 text-left text-[11px] md:text-xs font-semibold bg-slate-50 text-slate-700">
                  GUDANG
                </th>
                <th className="border border-slate-300 px-2 py-1 w-1/3 text-left text-[11px] md:text-xs font-semibold bg-slate-50 text-slate-700">
                  PIC
                </th>
                <th className="border border-slate-300 px-2 py-1 w-1/3 text-left text-[11px] md:text-xs font-semibold bg-slate-50 text-slate-700">
                  PRINCIPAL
                </th>

                <th className="border border-slate-300 px-1 py-1 w-[32px]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-300 px-1 py-0.5">
                    <input
                      className="w-full border-none outline-none px-1 py-0.5 text-xs"
                      value={row.gudang}
                      onChange={(e) =>
                        updateRow(idx, { gudang: e.target.value })
                      }
                    />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5">
                    <input
                      className="w-full border-none outline-none px-1 py-0.5 text-xs"
                      value={row.pic}
                      onChange={(e) => updateRow(idx, { pic: e.target.value })}
                    />
                  </td>
                  <td className="border border-slate-300 px-1 py-0.5">
                    <input
                      className="w-full border-none outline-none px-1 py-0.5 text-xs"
                      value={row.principal}
                      onChange={(e) =>
                        updateRow(idx, { principal: e.target.value })
                      }
                    />
                  </td>
                  <td className="border border-slate-300 text-center align-middle">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="m-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[10px] hover:bg-red-100"
                        title="Hapus baris"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tombol tambah baris */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={addRow}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            <Plus className="h-3 w-3" /> Tambah Baris
          </button>
        </div>

        {/* Deadline laporan jam */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span>Deadline Laporan Jam :</span>
          <input
            type="time"
            value={deadline}
            disabled={disabled}
            onChange={(e) => handleRowsChange(rows, e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
      </div>
    );
  }

  // ---------- PENUGASAN CYCLE COUNT (Gudang / PIC / PRINCIPAL + Deadline) ----------
  // if (isCycleAssign(f))
  //   if ((f as any).type === "invoice") {
  //     /* ---------- NEW: INVOICE (tabel) ---------- */
  //     type Row = {
  //       nomor: string;
  //       customer: string;
  //       jumlah: string;
  //       alasan: string;
  //     };
  //     const list: Row[] = Array.isArray(val) ? val : [];

  //     const addRow = () => {
  //       if (disabled) return;
  //       const next = [
  //         ...list,
  //         { nomor: "", customer: "", jumlah: "0", alasan: "" },
  //       ];
  //       setVal(secId, fid, next);
  //       requestAnimationFrame(() => {
  //         const el = document.querySelector<HTMLInputElement>(
  //           `[data-fid="${fid}"][data-r="${next.length - 1}"][data-c="nomor"]`
  //         );
  //         el?.focus();
  //       });
  //     };

  //     const removeRow = (idx: number) => {
  //       if (disabled) return;
  //       setVal(
  //         secId,
  //         fid,
  //         list.filter((_, i) => i !== idx)
  //       );
  //     };

  //     const setCell = (idx: number, patch: Partial<Row>) => {
  //       if (disabled) return;
  //       const next = [...list];
  //       next[idx] = { ...next[idx], ...patch };
  //       setVal(secId, fid, next);
  //     };

  //     const total = list.reduce(
  //       (a, r) => a + Number(String(r.jumlah || "0").replace(/[^\d]/g, "")),
  //       0
  //     );

  //     const cellCls =
  //       "border border-slate-300 px-2 py-1 text-sm bg-white focus-within:bg-white";
  //     const headCls =
  //       "border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-50";

  //     return (
  //       <div className="flex flex-col gap-2">
  //         {/* Judul + aksi kanan */}
  //         <div className="flex items-center justify-between">
  //           {!hideLabel && (
  //             <label className="text-sm font-medium text-black">
  //               {f.label}
  //               {(f as any).help && (
  //                 <span className="ml-2 text-xs text-black/60">
  //                   {(f as any).help}
  //                 </span>
  //               )}
  //             </label>
  //           )}
  //           <div className="flex items-center gap-2">
  //             <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
  //               {list.length} faktur
  //             </span>
  //             {canDesign && (
  //               <>
  //                 <button
  //                   onClick={onEdit}
  //                   className="no-print rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
  //                   title="Edit field"
  //                 >
  //                   <Pencil className="h-3 w-3" />
  //                 </button>
  //                 <button
  //                   onClick={onDelete}
  //                   className="no-print rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
  //                   title="Hapus field"
  //                 >
  //                   <Trash2 className="h-3 w-3" />
  //                 </button>
  //               </>
  //             )}
  //           </div>
  //         </div>

  //         {/* Tabel */}
  //         <div
  //           className={`rounded-xl border border-slate-300 ${
  //             disabled ? "opacity-60 pointer-events-none" : ""
  //           }`}
  //         >
  //           {/* Header */}
  //           <div className="grid grid-cols-[200px_minmax(160px,1fr)_140px_minmax(160px,1fr)_56px]">
  //             <div className={headCls}>Nomor Faktur</div>
  //             <div className={headCls}>Nama Customer</div>
  //             <div className={headCls}>Jumlah</div>
  //             <div className={headCls}>Alasan</div>
  //             <div className={headCls}>Aksi</div>
  //           </div>

  //           {/* Rows */}
  //           {list.length === 0 ? (
  //             <div className="grid grid-cols-[200px_minmax(160px,1fr)_140px_minmax(160px,1fr)_56px]">
  //               <div className="col-span-5 border border-slate-300 border-t-0 px-3 py-2 text-xs text-slate-500">
  //                 Belum ada data. Klik <b>Tambah Faktur</b> untuk menambah
  //                 baris.
  //               </div>
  //             </div>
  //           ) : (
  //             list.map((row, idx) => (
  //               <div
  //                 key={idx}
  //                 className="grid grid-cols-[200px_minmax(160px,1fr)_140px_minmax(160px,1fr)_56px]"
  //               >
  //                 {/* Nomor */}
  //                 <div className={cellCls}>
  //                   <input
  //                     data-fid={fid}
  //                     data-r={idx}
  //                     data-c="nomor"
  //                     value={row.nomor}
  //                     onChange={(e) => setCell(idx, { nomor: e.target.value })}
  //                     placeholder="IKK-25100689"
  //                     className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
  //                   />
  //                 </div>

  //                 {/* Customer */}
  //                 <div className={cellCls}>
  //                   <input
  //                     value={row.customer}
  //                     onChange={(e) =>
  //                       setCell(idx, { customer: e.target.value })
  //                     }
  //                     placeholder="DUA PUTRI - UDANAWU"
  //                     className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
  //                   />
  //                 </div>

  //                 {/* Jumlah */}
  //                 <div className={cellCls}>
  //                   <input
  //                     value={formatCurrency(row.jumlah)}
  //                     inputMode="numeric"
  //                     onChange={(e) =>
  //                       setCell(idx, {
  //                         jumlah: e.target.value.replace(/[^\d]/g, ""),
  //                       })
  //                     }
  //                     placeholder="0"
  //                     className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none text-right focus:ring-2 focus:ring-blue-500"
  //                   />
  //                 </div>

  //                 {/* Alasan */}
  //                 <div className={cellCls}>
  //                   <input
  //                     value={row.alasan}
  //                     onChange={(e) => setCell(idx, { alasan: e.target.value })}
  //                     placeholder="ADA RETUR / TUTUP"
  //                     className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
  //                   />
  //                 </div>

  //                 {/* Aksi */}
  //                 <div className="flex items-center justify-center border border-slate-300">
  //                   <button
  //                     type="button"
  //                     onClick={() => removeRow(idx)}
  //                     className="m-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-black hover:bg-slate-50"
  //                     title="Hapus baris"
  //                   >
  //                     <X className="h-3 w-3" />
  //                   </button>
  //                 </div>
  //               </div>
  //             ))
  //           )}
  //         </div>

  //         {/* Toolbar bawah */}
  //         <div className="mt-2 flex items-center justify-between">
  //           <button
  //             type="button"
  //             onClick={addRow}
  //             disabled={disabled}
  //             className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
  //           >
  //             <Plus className="h-3 w-3" /> Tambah Faktur
  //           </button>

  //           <div className="text-xs text-black/70">
  //             Total:{" "}
  //             <span className="font-semibold">{formatCurrency(total)}</span>
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   }

  // ---------- NEW: PO DELAY (baris: principal + hari) ----------
  if (isPoDelay(f)) {
    type Row = { principal: string; days: number };
    const list: Row[] = Array.isArray(val) ? val : [];

    const add = () => {
      if (disabled) return;
      setVal(secId, fid, [...list, { principal: "", days: 0 }]);
    };
    const del = (idx: number) => {
      if (disabled) return;
      setVal(
        secId,
        fid,
        list.filter((_, i) => i !== idx)
      );
    };
    const patch = (idx: number, patch: Partial<Row>) => {
      if (disabled) return;
      const next = [...list];
      next[idx] = { ...next[idx], ...patch };
      setVal(secId, fid, next);
    };

    return (
      <div className="flex flex-col gap-2">
        {/* Header: label + aksi (edit/hapus) */}
        <div className="flex items-center justify-between">
          {!hideLabel && (
            <label className="text-sm font-medium text-black">
              {f.label}
              {(f as any).help && (
                <span className="ml-2 text-xs text-black/60">
                  {(f as any).help}
                </span>
              )}
            </label>
          )}

          {canDesign && (
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={onEdit}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
                title="Edit field"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
                title="Hapus field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className={`rounded-xl border border-slate-200 ${
            disabled ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {list.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">
              Belum ada baris. Klik <b>Tambah</b>.
            </div>
          ) : (
            list.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_180px_60px] gap-2 border-t border-slate-100 p-3"
              >
                {/* Prinsipal */}
                <input
                  value={r.principal}
                  onChange={(e) => patch(i, { principal: e.target.value })}
                  placeholder="Prinsipal"
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                />

                {/* Hari */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">sudah lebih</span>
                  <input
                    type="number"
                    value={Number.isFinite(r.days) ? r.days : 0}
                    onChange={(e) =>
                      patch(i, { days: Number(e.target.value) || 0 })
                    }
                    className="w-20 rounded-md border border-slate-200 px-2 py-2 text-sm text-right"
                  />
                  <span className="text-xs text-slate-600">hari</span>
                </div>

                {/* Hapus baris */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => del(i)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                    title="Hapus baris"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Toolbar bawah */}
        <div className="no-print">
          <button
            type="button"
            onClick={add}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            <Plus className="h-3 w-3" /> Tambah
          </button>
        </div>
      </div>
    );
  }

  /* ---------- COMBO ---------- */
  const isComboType =
    typeof (f as any).type === "string" &&
    String((f as any).type).includes("+");

  if (isComboType) {
    const comboParts: ComboKind[] = String((f as any).type)
      .split("+")
      .map((s) => s.trim())
      .filter(Boolean) as ComboKind[];

    const obj: Record<string, any> =
      val && typeof val === "object" && !Array.isArray(val) ? val : {};

    const setCombo = (patch: Partial<Record<ComboKind | "note", any>>) => {
      if (disabled) return;
      setVal(secId, fid, { ...obj, ...patch });
    };

    function Part({ kind }: { kind: ComboKind }) {
      if (kind === "checkbox") {
        const list: string[] = Array.isArray(obj.checkbox) ? obj.checkbox : [];
        return (
          <div className={`flex flex-wrap gap-3 ${muted}`}>
            {asOptions(f).map((opt: string) => {
              const checked = list.includes(opt);
              return (
                <label
                  key={opt}
                  className="inline-flex items-center gap-2 text-sm text-black"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => {
                      if (disabled) return;
                      const next = new Set(list);
                      if (e.target.checked) next.add(opt);
                      else next.delete(opt);
                      setCombo({ checkbox: Array.from(next) });
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );
      }

      if (kind === "radio") {
        const cur: string = String(obj.radio ?? "");
        return (
          <div className={`flex flex-wrap gap-2 ${muted}`}>
            {asOptions(f).map((opt: string) => {
              const checked = cur === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setCombo({ radio: opt })}
                  className={
                    "rounded-xl px-3 py-1.5 text-sm ring-1 transition disabled:opacity-60 " +
                    (checked
                      ? "bg-blue-600 text-white ring-blue-600"
                      : "bg-white text-black ring-slate-200 hover:bg-slate-50")
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }

      if (kind === "number") {
        const num = Number(obj.number ?? 0);
        return (
          <input
            type="number"
            value={Number.isFinite(num) ? num : 0}
            disabled={disabled}
            onChange={(e) => setCombo({ number: Number(e.target.value) })}
            className={`w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 ${muted}`}
          />
        );
      }

      if (kind === "currency") {
        const cur = obj.currency ?? 0;
        return (
          <div className={`relative w-44 md:w-56 ${muted}`}>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
              Rp
            </span>
            <input
              value={formatCurrency(cur)}
              inputMode="numeric"
              disabled={disabled}
              onChange={(e) =>
                setCombo({ currency: e.target.value.replace(/[^\d]/g, "") })
              }
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-black focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      }

      const txt = String(obj.text ?? "");
      return (
        <input
          value={txt}
          disabled={disabled}
          onChange={(e) => setCombo({ text: e.target.value })}
          placeholder={(f as any).placeholder ?? ""}
          className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 ${muted}`}
        />
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          {!hideLabel && (
            <label className="text-sm font-medium text-black">
              {f.label}
              {(f as any).help && (
                <span className="ml-2 text-xs text-black/60">
                  {(f as any).help}
                </span>
              )}
            </label>
          )}
          {canDesign && (
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={onEdit}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
                title="Edit field"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
                title="Hapus field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* KIRI parts, KANAN keterangan */}
        <div className="md:grid md:grid-cols-[1fr_360px] gap-10">
          <div className="flex flex-col gap-4">
            {comboParts.map((p: ComboKind) => (
              <Part key={p} kind={p} />
            ))}
          </div>

          <div className="mt-4 md:mt-0 md:flex md:items-center md:pl-8">
            <div className={`w-full space-y-2 ${muted}`}>
              <label className="block text-xs font-medium text-black">
                Keterangan
              </label>
              <textarea
                value={String(obj.note ?? "")}
                onChange={(e) => setCombo({ note: e.target.value })}
                placeholder="Tambahkan catatan/keterangan"
                rows={4}
                disabled={disabled}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Multi series (lama) ---------- */
  if (isMultiField(f)) {
    const list: any[] = Array.isArray(val)
      ? val
      : val != null && val !== ""
      ? [val]
      : [];
    const totalNumber = (arr: number[]) =>
      arr.reduce((a, b) => a + (Number(b) || 0), 0);

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {!hideLabel && (
            <label className="text-sm font-medium text-black">
              {f.label}
              {(f as any).help && (
                <span className="ml-2 text-xs text-black/60">
                  {(f as any).help}
                </span>
              )}
            </label>
          )}
          {canDesign && (
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={onEdit}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
                title="Edit field"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
                title="Hapus field"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {list.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {f.type === "number" && (
                <input
                  type="number"
                  value={Number.isFinite(v as number) ? v : 0}
                  disabled={disabled}
                  onChange={(e) => {
                    if (disabled) return;
                    const next = [...list];
                    next[idx] = Number(e.target.value);
                    setVal(secId, (f as any).id, next);
                  }}
                  className={`w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 ${
                    disabled ? "opacity-60" : ""
                  }`}
                />
              )}

              {f.type === "currency" && (
                <div className={`relative ${disabled ? "opacity-60" : ""}`}>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
                    Rp
                  </span>
                  <input
                    value={formatCurrency(v as string | number)}
                    inputMode="numeric"
                    disabled={disabled}
                    onChange={(e) => {
                      if (disabled) return;
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const next = [...list];
                      next[idx] = raw;
                      setVal(secId, (f as any).id, next);
                    }}
                    placeholder={(f as any).placeholder}
                    className="w-48 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-black focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {f.type === "text" && (
                <input
                  value={String(v ?? "")}
                  disabled={disabled}
                  onChange={(e) => {
                    if (disabled) return;
                    const next = [...list];
                    next[idx] = e.target.value;
                    setVal(secId, (f as any).id, next);
                  }}
                  placeholder={(f as any).placeholder}
                  className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 ${
                    disabled ? "opacity-60" : ""
                  }`}
                />
              )}

              <button
                onClick={() => {
                  if (disabled) return;
                  const next = list.filter((_, i) => i !== idx);
                  setVal(secId, (f as any).id, next);
                }}
                disabled={disabled}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-black hover:bg-slate-50 no-print disabled:opacity-60"
                title="Hapus baris"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <div className="no-print">
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setVal(secId, (f as any).id, [
                  ...list,
                  (f as any).type === "text" ? "" : 0,
                ])
              }
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              <Plus className="h-3 w-3" /> Tambah{" "}
              {(f as any).type === "text" ? "Item" : "Faktur"}
            </button>
          </div>

          {(f.type === "number" || f.type === "currency") && (
            <div className="text-xs text-black/70">
              Total:{" "}
              <span className="font-semibold">
                {formatCurrency(
                  totalNumber(list.map((x) => Number(String(x || 0))))
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- Single field ---------- */
  const fid2 = (f as any)?.id || f.id;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        {!hideLabel && (
          <label className="text-sm font-medium text-black">
            {f.label}
            {(f as any).help && (
              <span className="ml-2 text-xs text-black/60">
                {(f as any).help}
              </span>
            )}
          </label>
        )}
        {canDesign && (
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={onEdit}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-black hover:bg-slate-50"
              title="Edit field"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-100"
              title="Hapus field"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {f.type === "checkbox" && (
        <div className={`flex flex-wrap gap-3 ${disabled ? "opacity-60" : ""}`}>
          {asOptions(f).map((opt: string) => {
            const list: string[] = Array.isArray(val) ? val : [];
            const checked = list.includes(opt);
            return (
              <label
                key={opt}
                className="inline-flex items-center gap-2 text-sm text-black"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => {
                    if (disabled) return;
                    const next = new Set(list);
                    if (e.target.checked) next.add(opt);
                    else next.delete(opt);
                    setVal(secId, (f as any).id, Array.from(next));
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      )}

      {f.type === "radio" && (
        <div className={`flex flex-wrap gap-2 ${disabled ? "opacity-60" : ""}`}>
          {asOptions(f).map((opt: string) => {
            const checked = (val as string) === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setVal(secId, (f as any).id, opt)}
                className={
                  "rounded-xl px-3 py-1.5 text-sm ring-1 transition disabled:opacity-60 " +
                  (checked
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-black ring-slate-200 hover:bg-slate-50")
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {f.type === "number" && !isMultiNumber(f) && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={val as number}
            disabled={disabled}
            onChange={(e) =>
              !disabled && setVal(secId, fid2, Number(e.target.value))
            }
            className={`w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 ${
              disabled ? "opacity-60" : ""
            }`}
          />
          {(f as any).suffix && (
            <span className="text-sm text-black/70">{(f as any).suffix}</span>
          )}
        </div>
      )}

      {f.type === "text" && !isMultiText(f) && (
        <input
          value={(val as string) ?? ""}
          placeholder={(f as any).placeholder}
          disabled={disabled}
          onChange={(e) => !disabled && setVal(secId, fid2, e.target.value)}
          className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 ${
            disabled ? "opacity-60" : ""
          }`}
        />
      )}

      {f.type === "currency" && !isMultiCurrency(f) && (
        <div
          className={`relative w-44 md:w-56 ${disabled ? "opacity-60" : ""}`}
        >
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
            Rp
          </span>
          <input
            value={formatCurrency(val as string | number)}
            inputMode="numeric"
            disabled={disabled}
            onChange={(e) =>
              !disabled &&
              setVal(secId, fid2, e.target.value.replace(/[^\d]/g, ""))
            }
            placeholder={(f as any).placeholder}
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-black focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

function PrintModelPrincipal({
  sections,
  form,
}: {
  sections: ChecklistSection[];
  form: Record<string, Record<string, any>>;
}) {
  return (
    <div className="text-[11px] leading-[1.25] text-black">
      {sections.map((sec) => {
        // ambil field multi text yang ditandai untuk model
        const modelFields = (sec.fields ?? []).filter(isPrincipalModel);
        if (modelFields.length === 0) return null;

        return (
          <div key={sec.id} className="mb-6">
            <div className="font-semibold mb-2">
              Penerimaan Barang dari Prinsipal
            </div>

            {modelFields.map((f: any) => {
              const items: string[] = Array.isArray(form?.[sec.id]?.[f.id])
                ? form[sec.id][f.id]
                : [];

              // keterangan (jika satu grup sama-seperti UI kanan) – ambil text dengan group_order=99
              // kalau tidak ada, abaikan
              let noteId: string | null = null;
              if (Array.isArray(sec.fields)) {
                const sameGroup = sec.fields.filter(
                  (x: any) => (x.group_key || x.id) === (f.group_key || f.id)
                );
                const note = sameGroup.find(
                  (x: any) => (x.group_order ?? 0) === 99
                );
                noteId = (note as any)?.id ?? null;
              }

              return (
                <div key={f.id}>
                  {items.length === 0 ? (
                    <div className="mb-2 italic opacity-70">
                      (Belum ada item)
                    </div>
                  ) : (
                    items.map((txt, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[18px_1fr_220px] gap-8 items-start mb-3"
                      >
                        {/* Nomor */}
                        <div className="text-right pr-1">{i + 1}</div>

                        {/* Deskripsi + Note kecil */}
                        <div>
                          <div className="font-medium">
                            {txt || "____________________________"}
                          </div>
                          {noteId ? (
                            <div className="text-[10px] mt-0.5">
                              <span className="font-medium">Note :</span>{" "}
                              {String(form?.[sec.id]?.[noteId] ?? "")}
                            </div>
                          ) : null}
                        </div>

                        {/* Kolom kanan: "Keterangan:" + garis-bergaris */}
                        <div>
                          <div className="text-[10px] mb-1">Keterangan:</div>
                          <div className="h-[1px] bg-black/70" />
                          <div className="h-[1px] bg-black/70 mt-[10px]" />
                          <div className="h-[1px] bg-black/70 mt-[10px]" />
                          <div className="h-[1px] bg-black/70 mt-[10px]" />
                          <div className="h-[1px] bg-black/70 mt-[10px]" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ==== DETEKTOR FIELD PENUGASAN CYCLE COUNT (GUDANG / PIC / PRINCIPAL) ====
const isCycleAssign = (f: any) => {
  if (!f) return false;
  const t = String(f.type ?? "").toLowerCase();
  // kita simpan di DB sebagai "text"
  if (t !== "text") return false;

  const mark = `${f.label ?? ""} ${f.placeholder ?? ""}`.toLowerCase();
  return (
    mark.includes("penugasan cycle count") ||
    mark.includes("cycle count") ||
    mark.includes("cycle_assign")
  );
};

// ==== Utils (letakkan di atas, bersama fungsi util lain) ====
// ==== Utils: detektor field "model penerimaan barang dari prinsipal" ====
export const isPrincipalModel = (f: any) => {
  // hanya untuk text yang multi+
  const isMultiText =
    String(f?.type) === "text" &&
    String(f?.placeholder || "")
      .toLowerCase()
      .includes("multi+");
  if (!isMultiText) return false;

  // cek label/placeholder berisi penanda model
  const mark = `${f?.label ?? ""} ${f?.placeholder ?? ""}`.toLowerCase();
  return (
    mark.includes("penerimaan barang dari prinsipal") ||
    mark.includes("model:prinsipal") ||
    mark.includes("model:principal")
  );
};

/* ===================== Page ===================== */
export default function ChecklistClient({
  template,
  canDesign,
}: {
  template: ChecklistSection[];
  canDesign: boolean;
}) {
  const [leader, setLeader] = useState("");
  const [depo, setDepo] = useState("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [activePeriod, setActivePeriod] = useState<Period>("daily");

  const [sections, setSections] = useState<ChecklistSection[]>(
    Array.isArray(template) ? template : []
  );
  const [form, setForm] = useState<Record<string, Record<string, any>>>({});

  // Jadwal (diatur Super Admin)
  const [schedules, setSchedules] = useState<{
    weekly: string[];
    monthly: string[];
  }>({ weekly: [], monthly: [] });

  /* Role */
  const ROLE_OPTIONS = [
    { key: "kepala_gudang", name: "Kepala Gudang" },
    { key: "kepala_admin", name: "Kepala Admin" },
    { key: "spv", name: "SPV" },
    { key: "sales_manager", name: "Sales Manager" },
    { key: "bsdc", name: "BSDC" },
    { key: "hrd", name: "HRD" },
    { key: "direktur", name: "Direktur" },
    { key: "it", name: "IT" },
  ];
  const ELEVATED = new Set(["it", "direktur", "hrd"]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [roleView, setRoleView] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/whoami", { cache: "no-store" });
        const j = await r.json().catch(() => null);

        const rk = j?.profile?.role_key ?? null;
        setMyRole(rk);
        setRoleView((prev) => prev ?? rk);

        // --- Prefill Leader dari profile.full_name → username email → ""
        const leaderName =
          j?.profile?.full_name ||
          (j?.user?.email ? String(j.user.email).split("@")[0] : "") ||
          "";

        setLeader((prev) => prev || titleCase(leaderName));

        // --- Depo default (sesuai permintaan)
        setDepo((prev) => prev || titleCase("tulungagung"));
      } catch {
        // fallback kalau whoami gagal
        setDepo((prev) => prev || titleCase("tulungagung"));
      }
    })();
  }, []);

  // === NEW: editor whitelist tanggal untuk section (weekly only) ===
  async function editSectionWeeklyOpen(sec: ChecklistSection) {
    // nilai sekarang
    const cur = (sec.weekly_open ?? []).join(", ");

    // prompt user; kosongkan untuk ikut jadwal global
    const raw =
      window.prompt(
        `Tanggal dibuka KHUSUS untuk section "${sec.title}" (YYYY-MM-DD, pisahkan dengan koma).\n` +
          `Kosongkan untuk ikut jadwal global:`,
        cur
      ) ?? cur;

    // normalisasi -> array 'YYYY-MM-DD'
    const list = (raw || "")
      .split(",")
      .map((s) => normDate(s.trim()))
      .filter(Boolean);

    try {
      const res = await fetch(`${SECTION_BASE}/${sec.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ weekly_open: list }), // <— kirim weekly_open
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return alert(j?.error || "Gagal menyimpan tanggal section");

      await refreshSections(sec.id); // muat ulang agar state weekly_open terbaru
      alert("Tanggal khusus section tersimpan.");
    } catch {
      alert("Gagal menyimpan tanggal section (client).");
    }
  }

  async function pickRole(): Promise<string | null> {
    let role = (roleView || myRole) ?? null;
    if (!role) {
      const r = window.prompt(
        'Role belum terdeteksi.\nMasukkan role key (mis. "spv", "hrd", "it", "kepala_admin", ...):',
        ""
      );
      if (r && r.trim()) {
        role = r.trim();
        setRoleView(role);
      } else {
        return null;
      }
    }
    return role;
  }

  // Load jadwal per-role
  async function loadSchedules() {
    try {
      const role = await pickRole();
      if (!role) return;

      const r = await fetch(
        `${SCHEDULES_API}?role=${encodeURIComponent(role)}&ts=${Date.now()}`,
        { cache: "no-store" }
      );
      const j = await r.json().catch(() => null);
      const weekly = Array.isArray(j?.weekly) ? j.weekly.map(anyToYMD) : [];
      const monthly = Array.isArray(j?.monthly) ? j.monthly.map(anyToYMD) : [];

      setSchedules({ weekly, monthly });
    } catch {
      setSchedules({ weekly: [], monthly: [] });
    }
  }
  useEffect(() => {
    if (roleView || myRole) loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleView, myRole]);

  /* Section navigation */
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const safeIdx = (idx: number) => {
    const len = sections?.length ?? 0;
    if (len === 0) return 0;
    return Math.min(Math.max(idx, 0), len - 1);
  };
  useEffect(() => setCurrentIdx((i) => safeIdx(i)), [sections]);
  useEffect(() => setCurrentIdx(0), [activePeriod]);

  const goPrev = () => setCurrentIdx((i) => safeIdx(i - 1));
  const goNext = () => setCurrentIdx((i) => safeIdx(i + 1));
  const jumpTo = (i: number) => setCurrentIdx(safeIdx(i));

  // ===== NEW: izinkan reorder section (hanya daily + super mode) =====
  const canReorderSections = Boolean(canDesign && activePeriod === "daily");

  /* Init form mengikuti sections */
  /* Init form mengikuti sections */
  /* Init form mengikuti sections */
  useEffect(() => {
    if (!Array.isArray(sections) || sections.length === 0) {
      setForm({});
      return;
    }
    setForm(buildEmptyFormFromSections(sections));
  }, [sections]);

  /* LOAD SECTIONS */
  async function refreshSections(
    newlyCreatedId?: string,
    roleOverride?: string
  ) {
    const role = roleOverride || roleView || myRole;
    if (!role) {
      console.warn("[refreshSections] role belum siap");
      return;
    }

    const url = new URL(SECTION_BASE, window.location.origin);
    url.searchParams.set("feature", "checklist");
    url.searchParams.set("role", role);
    url.searchParams.set("period", activePeriod);
    url.searchParams.set("withFields", "1");
    url.searchParams.set("ts", String(Date.now()));

    const res = await fetch(url.toString(), { cache: "no-store" });
    const raw = await res.text();
    let j: any = null;
    try {
      j = JSON.parse(raw);
    } catch {}

    if (!res.ok) {
      alert((j && j.error) || "Gagal memuat sections");
      return;
    }

    const list = Array.isArray(j?.sections) ? j.sections : [];
    setSections(list);

    if (list.length === 0) {
      setCurrentIdx(0);
      return;
    }
    if (newlyCreatedId) {
      const idx = list.findIndex((s: any) => s.id === newlyCreatedId);
      setCurrentIdx(idx >= 0 ? idx : 0);
    } else {
      setCurrentIdx((i) => Math.min(Math.max(i, 0), list.length - 1));
    }
  }

  useEffect(() => {
    if (roleView || myRole) Promise.resolve().then(() => refreshSections());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleView, myRole, activePeriod]);

  /* LOAD VALUES */
  async function loadSaved() {
    if (!Array.isArray(sections) || sections.length === 0) return;
    const roleKey = (roleView || myRole || "").trim();

    const qs = new URLSearchParams({
      date,
      depo: depo ?? "",
      period: activePeriod,
    });

    // ⬇️ TAMBAH INI (biar load data sesuai role)
    if (roleKey) qs.set("role_key", roleKey);

    const res = await fetch(`${FORM_API}?${qs}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!json?.form) return;

    const values = (json.values ?? []) as Array<{
      section_id: string;
      field_id: string;
      value_text: string | null;
      value_number: number | null;
    }>;
    const next: Record<string, Record<string, any>> = {};
    for (const s of sections) next[s.id] = {};

    for (const v of values) {
      const sec = sections.find((x) => x.id === v.section_id);
      const fld = sec?.fields?.find((x) => (x as any).id === v.field_id);
      if (!fld) continue;

      const t = (fld as any).type as Field["type"];

      if (String((fld as any).type) === "invoice") {
        // invoice: simpan di value_text (JSON array)
        let arr: any[] = [];
        try {
          const parsed = JSON.parse(String(v.value_text ?? "[]"));
          if (Array.isArray(parsed)) arr = parsed;
        } catch {}
        next[v.section_id][v.field_id] = arr;
      } else if (isPoDelay(fld)) {
        // PO delay: JSON array di value_text
        let arr: any[] = [];
        try {
          const parsed = JSON.parse(String(v.value_text ?? "[]"));
          if (Array.isArray(parsed)) arr = parsed;
        } catch {}
        next[v.section_id][v.field_id] = arr;
      } else if (isCycleTable(fld)) {
        // cycle_table: STRING encode baris (bukan JSON)
        next[v.section_id][v.field_id] = String(v.value_text ?? "");
      } else if (isImageField(fld)) {
        // image: URL string
        next[v.section_id][v.field_id] = String(v.value_text ?? "");
      } else if (isMultiNumber(fld) || isMultiCurrency(fld)) {
        next[v.section_id][v.field_id] = [v.value_number ?? 0];
      } else if (isMultiText(fld)) {
        next[v.section_id][v.field_id] = [v.value_text ?? ""];
      } else if (String((fld as any).type || "").includes("+")) {
        // ✅ COMBO: value_text berisi JSON object
        const rawText = String(v.value_text ?? "");
        try {
          const obj = JSON.parse(rawText);
          next[v.section_id][v.field_id] =
            obj && typeof obj === "object" && !Array.isArray(obj)
              ? obj
              : { note: rawText };
        } catch {
          // fallback kalau data lama masih string note
          next[v.section_id][v.field_id] = { note: rawText };
        }
      } else if (t === "checkbox") {
        const raw = String(v.value_text ?? "").trim();
        next[v.section_id][v.field_id] = raw
          ? raw
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      } else {
        next[v.section_id][v.field_id] =
          t === "number" || t === "currency"
            ? v.value_number ?? 0
            : v.value_text ?? "";
      }
    }

    setLeader((prev) =>
      json.form?.leader ? titleCase(json.form.leader) : prev
    );
    setDepo((prev) => (json.form?.depo ? titleCase(json.form.depo) : prev));

    setForm((prev) => ({ ...prev, ...next }));
  }
  const secLen = sections?.length ?? 0;
  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, depo, secLen, activePeriod, roleView, myRole]);

  /* Derived counters */
  const totalFields = useMemo(
    () =>
      Array.isArray(sections)
        ? sections.reduce((a, s) => a + (s.fields?.length ?? 0), 0)
        : 0,
    [sections]
  );

  const filledCount = useMemo(() => {
    let c = 0;
    if (!Array.isArray(sections)) return 0;

    for (const s of sections) {
      for (const f of s.fields ?? []) {
        const fid = (f as any).id;
        const v = form[s.id]?.[fid];

        // // khusus Penugasan Cycle Count
        // if (isCycleAssign(f)) {
        //   const rows: any[] = Array.isArray(v) ? v : [];
        //   const hasRow = rows.some(
        //     (r) =>
        //       String(r?.gudang ?? "").trim() !== "" ||
        //       String(r?.pic ?? "").trim() !== "" ||
        //       String(r?.principal ?? "").trim() !== ""
        //   );
        //   if (hasRow) c++;
        //   continue;
        // }

        if (Array.isArray(v)) {
          let any = false;

          if (String((f as any).type) === "invoice") {
            any = (v as any[]).some(
              (row: any) =>
                row &&
                (String(row?.nomor ?? "").trim() !== "" ||
                  String(row?.customer ?? "").trim() !== "" ||
                  String(row?.alasan ?? "").trim() !== "" ||
                  Number(String(row?.jumlah ?? "0")) > 0)
            );
          } else {
            any = (v as any[]).some((x) =>
              (f as any).type === "text" || (f as any).type === "checkbox"
                ? String(x ?? "").trim().length > 0
                : Number(x ?? 0) > 0
            );
          }

          if (any) c++;
        } else {
          if (
            String((f as any).type) === "number" ||
            String((f as any).type) === "currency"
          ) {
            if (Number(v ?? 0) > 0) c++;
          } else if (String((f as any).type) === "checkbox") {
            if (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "")
              c++;
          } else if (String((f as any).type) === "invoice") {
            const arr = Array.isArray(v) ? v : [];
            const any = arr.some(
              (row: any) =>
                row &&
                (String(row?.nomor ?? "").trim() !== "" ||
                  String(row?.customer ?? "").trim() !== "" ||
                  String(row?.alasan ?? "").trim() !== "" ||
                  Number(String(row?.jumlah ?? "0")) > 0)
            );
            if (any) c++;
          } else {
            if (String(v ?? "").trim() !== "") c++;
          }
        }
      }
    }

    return c;
  }, [sections, form]);

  const setVal = (secId: string, fieldId: string, raw: any) => {
    setForm((prev) => ({
      ...prev,
      [secId]: {
        ...(prev[secId] ?? {}),
        [fieldId]: raw,
      },
    }));
  };

  /* Jadwal: hitung terkunci / tidak */
  const isAllowedToday = (period: Period, d: string) => {
    const ds = normDate(d);
    if (period === "daily") return true;
    if (period === "weekly") return schedules.weekly.includes(ds);
    if (period === "monthly") return schedules.monthly.includes(ds);
    return true;
  };
  const lockedGlobal = !isAllowedToday(activePeriod, date);
  const lockedFor = (sec?: ChecklistSection) => {
    if (activePeriod === "weekly") {
      return lockedGlobal || !isAllowedWeeklySection(date, sec);
    }
    return lockedGlobal;
  };

  // ⬇️ NEW: validasi weekly per-section
  const isAllowedWeeklySection = (dateStr: string, sec?: ChecklistSection) => {
    const ds = normDate(dateStr);
    // wajib lolos jadwal weekly global dulu
    if (!schedules.weekly.includes(ds)) return false;
    // kalau section punya whitelist tanggal, wajib termasuk
    if (sec?.weekly_open && sec.weekly_open.length > 0) {
      return sec.weekly_open.includes(ds);
    }
    // kalau tidak ada whitelist: ikut global
    return true;
  };

  /* SAVE form */
  /* SAVE form */
  async function saveForm() {
    const sec = sections[currentIdx];
    const isAllowedToday = (period: Period, d: string) => {
      const ds = normDate(d);
      if (period === "daily") return true;
      if (period === "weekly") return schedules.weekly.includes(ds);
      if (period === "monthly") return schedules.monthly.includes(ds);
      return true;
    };
    const lockedGlobal = !isAllowedToday(activePeriod, date);
    const isAllowedWeeklySection = (
      dateStr: string,
      sec?: ChecklistSection
    ) => {
      const ds = normDate(dateStr);
      if (!schedules.weekly.includes(ds)) return false;
      if (sec?.weekly_open && sec.weekly_open.length > 0) {
        return sec.weekly_open.includes(ds);
      }
      return true;
    };
    const lockedFor = (sec?: ChecklistSection) => {
      if (activePeriod === "weekly") {
        return lockedGlobal || !isAllowedWeeklySection(date, sec);
      }
      return lockedGlobal;
    };

    if (lockedFor(sec)) {
      alert("Section ini terkunci untuk tanggal ini.");
      return;
    }

    const values: Array<{
      section_id: string;
      field_id: string;
      type: string;
      value: string | number;
    }> = [];

    for (const s of sections ?? []) {
      for (const f of s.fields ?? []) {
        const fieldId = (f as any).id;
        const raw = form[s.id]?.[fieldId];
        const t = (f as any).type as Field["type"];

        let val: string | number;

        if (String((f as any).type) === "invoice") {
          val = JSON.stringify(Array.isArray(raw) ? raw : []);
        } else if (isPoDelay(f)) {
          val = JSON.stringify(Array.isArray(raw) ? raw : []);
        } else if (isCycleTable(f)) {
          // cycle_table simpan STRING (encode)
          val = String(raw ?? "");
        } else if (isImageField(f)) {
          // image simpan URL string
          val = String(raw ?? "");
        } else if (Array.isArray(raw)) {
          // multi number/currency/text/checkbox lama
          val =
            t === "text" || t === "checkbox"
              ? (raw as string[])
                  .map((x) => String(x || "").trim())
                  .filter(Boolean)
                  .join(" | ")
              : (raw as any[]).reduce((a, b) => a + (Number(b) || 0), 0);
        } else if (t === "currency") {
          val = Number(String(raw ?? "0").replace(/[^\d]/g, ""));
        } else if (t === "number") {
          val = Number(raw ?? 0);
        } else if (String((f as any).type || "").includes("+")) {
          // ✅ COMBO: simpan semua part (radio/checkbox/number/text/currency + note) sebagai JSON
          val = JSON.stringify(
            raw && typeof raw === "object" && !Array.isArray(raw)
              ? raw
              : { note: String(raw ?? "") }
          );
        } else {
          val = String(raw ?? "");
        }

        values.push({
          section_id: s.id,
          field_id: fieldId,
          type: (f as any).type,
          value: val,
        });
      }
    }

    const payload = {
      form_date: date,
      depo: (depo ?? "").trim(),
      leader: (leader ?? "").trim(),
      period: activePeriod,
      role_key: roleView || myRole || null, // ⬅️ TAMBAHKAN INI
      values,
    } as const;

    if (!payload.form_date) return alert("Tanggal wajib diisi.");
    if (!payload.leader) return alert("Leader wajib diisi.");
    if (!payload.depo) return alert("Depo wajib diisi.");

    const res = await fetch(FORM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal menyimpan");
    alert("Tersimpan!");
  }

  async function saveAllAndReset() {
    // validasi header
    if (!date) return alert("Tanggal wajib diisi.");
    if (!leader) return alert("Leader wajib diisi.");
    if (!depo) return alert("Depo wajib diisi.");

    // siapkan array values
    const values: Array<{
      section_id: string;
      field_id: string;
      type: string;
      value: any;
    }> = [];

    for (const s of sections ?? []) {
      for (const f of s.fields ?? []) {
        const fieldId = (f as any).id;
        const raw = form[s.id]?.[fieldId];
        const t = (f as any).type as Field["type"];

        let val: any;

        if (t === "invoice") {
          val = JSON.stringify(Array.isArray(raw) ? raw : []);
        } else if (isPoDelay(f)) {
          val = JSON.stringify(Array.isArray(raw) ? raw : []);
        } else if (isCycleTable(f)) {
          val = String(raw ?? "");
        } else if (isImageField(f)) {
          val = String(raw ?? "");
        } else if (Array.isArray(raw)) {
          if (t === "text" || t === "checkbox") {
            val = (raw as string[])
              .map((x) => String(x || "").trim())
              .filter(Boolean)
              .join(" | ");
          } else {
            val = (raw as any[]).reduce((a, b) => a + (Number(b) || 0), 0);
          }
        } else if (t === "currency") {
          val = Number(String(raw ?? "0").replace(/[^\d]/g, ""));
        } else if (t === "number") {
          val = Number(raw ?? 0);
        } else if (String(t || "").includes("+")) {
          // ✅ COMBO: simpan sebagai JSON utuh
          val = JSON.stringify(
            raw && typeof raw === "object" && !Array.isArray(raw)
              ? raw
              : { note: String(raw ?? "") }
          );
        } else {
          val = String(raw ?? "");
        }

        values.push({
          section_id: s.id,
          field_id: fieldId,
          type: (f as any).type,
          value: val,
        });
      }
    }

    // kirim ke API yang sama
    const res = await fetch(FORM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form_date: date,
        depo: depo.trim(),
        leader: leader.trim(),
        period: activePeriod,
        role_key: roleView || myRole || null, // ⬅️ TAMBAHKAN INI
        values,
      }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return alert(j?.error || "Gagal menyimpan semua checklist");
    }

    // ✅ sukses → reset
    setForm(buildEmptyFormFromSections(sections));
    alert("Tersimpan dan form di-reset ✅");

    alert("Tersimpan dan form di-reset ✅");
  }

  /* Super admin auth */
  const [superBusy, setSuperBusy] = useState(false);
  async function enableSuperAdmin() {
    const pwd = window.prompt("Masukkan password Super Admin");
    if (!pwd) return;
    setSuperBusy(true);
    try {
      const r = await fetch(`${SUPER_BASE}/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return alert(j?.error || "Gagal mengaktifkan");
      window.location.reload();
    } finally {
      setSuperBusy(false);
    }
  }
  async function disableSuperAdmin() {
    setSuperBusy(true);
    try {
      await fetch(`${SUPER_BASE}/disable`, { method: "POST" });
      window.location.reload();
    } finally {
      setSuperBusy(false);
    }
  }

  /* Editor Jadwal */
  async function openScheduleEditor() {
    try {
      const role = await pickRole();
      if (!role) return;

      const wNow = schedules.weekly.join(", ");
      const mNow = schedules.monthly.join(", ");

      const wRaw =
        window.prompt(
          `Tanggal MINGGUAN yang dibuka (YYYY-MM-DD, pisahkan dengan koma):`,
          wNow
        ) ?? wNow;

      const mRaw =
        window.prompt(
          `Tanggal BULANAN yang dibuka (YYYY-MM-DD, pisahkan dengan koma):`,
          mNow
        ) ?? mNow;

      const weeklyStr = wRaw
        .split(",")
        .map((s) => normDate(s.trim()))
        .filter(Boolean);
      const monthlyStr = mRaw
        .split(",")
        .map((s) => normDate(s.trim()))
        .filter(Boolean);

      const weeklyInts = weeklyStr.map(dateStrToInt).filter(Boolean);
      const monthlyInts = monthlyStr.map(dateStrToInt).filter(Boolean);

      const res = await fetch(
        `${SCHEDULES_API}?role=${encodeURIComponent(role)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            role_key: role,
            weekly: weeklyInts,
            monthly: monthlyInts,
          }),
        }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.error || "Gagal menyimpan jadwal");
        return;
      }

      setSchedules({
        weekly: weeklyStr.map(anyToYMD),
        monthly: monthlyStr.map(anyToYMD),
      });

      alert("Jadwal tersimpan.");
    } catch {
      alert("Gagal menyimpan jadwal (client).");
    }
  }

  async function openScheduleEditorFor(
    period: "weekly" | "monthly",
    role: string
  ) {
    try {
      const currentStr =
        period === "weekly" ? schedules.weekly : schedules.monthly;
      const promptLabel =
        period === "weekly"
          ? "Tanggal MINGGUAN yang dibuka (YYYY-MM-DD, pisahkan dengan koma):"
          : "Tanggal BULANAN yang dibuka (YYYY-MM-DD, pisahkan dengan koma):";

      const cur = currentStr.join(", ");
      const raw = window.prompt(promptLabel, cur) ?? cur;

      const pickedStr = raw
        .split(",")
        .map((s) => normDate(s.trim()))
        .filter(Boolean);
      const pickedInts = pickedStr.map(dateStrToInt).filter(Boolean);

      const body =
        period === "weekly"
          ? {
              weekly: pickedInts,
              monthly: schedules.monthly.map(dateStrToInt).filter(Boolean),
            }
          : {
              weekly: schedules.weekly.map(dateStrToInt).filter(Boolean),
              monthly: pickedInts,
            };

      const res = await fetch(
        `${SCHEDULES_API}?role=${encodeURIComponent(role)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return alert(j?.error || "Gagal menyimpan jadwal");

      setSchedules({
        weekly:
          period === "weekly"
            ? pickedStr.map(anyToYMD)
            : schedules.weekly.map(anyToYMD),
        monthly:
          period === "monthly"
            ? pickedStr.map(anyToYMD)
            : schedules.monthly.map(anyToYMD),
      });

      alert(
        period === "weekly"
          ? "Jadwal mingguan tersimpan."
          : "Jadwal bulanan tersimpan."
      );
    } catch {
      alert("Gagal menyimpan jadwal (client).");
    }
  }

  const handlePrint = () => window.print();

  /* ========== CRUD section & field ========== */
  async function createOne(payload: any) {
    const res = await fetch(FIELDS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || "Gagal menambah field");
    return j;
  }

  async function moveSection(secId: string, delta: -1 | 1) {
    const list = sections ?? [];
    const curIndex = list.findIndex((s) => s.id === secId);
    if (curIndex < 0) return;
    const targetIndex = curIndex + delta;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const a = list[curIndex];
    const b = list[targetIndex];

    const idxA = a.idx ?? curIndex;
    const idxB = b.idx ?? targetIndex;

    try {
      await fetch(`${SECTION_BASE}/${a.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ idx: idxB }),
      });

      await fetch(`${SECTION_BASE}/${b.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ idx: idxA }),
      });

      await refreshSections(a.id);
    } catch {
      alert("Gagal mengubah urutan section.");
    }
  }

  async function moveGroup(
    sectionId: string,
    groupKeyOrId: string,
    delta: -1 | 1
  ) {
    const sec = (sections ?? []).find((s) => s.id === sectionId);
    if (!sec) return;

    const buckets: Record<string, any[]> = {};
    for (const f of sec.fields ?? []) {
      const key = (f as any).group_key || (f as any).id;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(f);
    }

    const groupArr = Object.entries(buckets)
      .map(([gkey, items]) => {
        const orderIndex = Math.min(
          ...items.map((it: any, i: number) =>
            Number.isFinite(it.idx) ? it.idx : i
          )
        );
        return { gkey, items, orderIndex };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const curIndex = groupArr.findIndex((g) => g.gkey === groupKeyOrId);
    if (curIndex < 0) return;

    const targetIndex = curIndex + delta;
    if (targetIndex < 0 || targetIndex >= groupArr.length) return;

    const A = groupArr[curIndex];
    {
      const B = groupArr[targetIndex];
      const idxA = A.orderIndex;
      const idxB = B.orderIndex;

      try {
        const patchAll: Promise<any>[] = [];

        A.items.forEach((f: any, i: number) => {
          patchAll.push(
            fetch(`${FIELDS_API}/${f.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
              body: JSON.stringify({ idx: idxB + i }),
            })
          );
        });

        B.items.forEach((f: any, i: number) => {
          patchAll.push(
            fetch(`${FIELDS_API}/${f.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
              body: JSON.stringify({ idx: idxA + i }),
            })
          );
        });

        await Promise.all(patchAll);
        await refreshSections(sectionId);
      } catch {
        alert("Gagal mengubah urutan item.");
      }
    }
  }

  async function promptPartPayload(
    sectionId: string,
    type: string,
    {
      group_key,
      group_label,
      order,
      defaultLabel,
    }: {
      group_key?: string;
      group_label?: string | null;
      order: number;
      defaultLabel?: string;
    }
  ) {
    const t = type.trim().toLowerCase();
    if (
      ![
        "radio",
        "checkbox",
        "number",
        "text",
        "currency",
        "invoice",
        "image", // ⬅️ ini yang baru
        "cycle_table",
      ].includes(t)
    ) {
      throw new Error(`Tipe tidak didukung: ${type}`);
    }

    const baseLabel =
      window.prompt(`Label untuk bagian ${t}:`, defaultLabel ?? "") || "";
    const label = baseLabel.trim();

    const help =
      (
        window.prompt(`Keterangan (opsional) untuk ${label || t}:`, "") || ""
      ).trim() || null;

    const payload: any = {
      section_id: sectionId,
      type: t,
      label,
      help,
      group_key,
      group_label: group_label ?? null,
      group_order: order,
    };

    if (t === "radio" || t === "checkbox") {
      const raw =
        window.prompt(
          `Opsi ${t} (pisah dengan "|")`,
          t === "radio" ? "Cocok|Tidak Cocok|N/A" : "OK|NG"
        ) || "";
      const options = raw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length === 0) throw new Error("Opsi tidak boleh kosong");
      payload.options = options;
    }

    if (t === "number") {
      const suffix = window.prompt("Suffix (opsional, contoh: pcs)", "") || "";
      const min = window.prompt("Min (opsional)", "") || "";
      const max = window.prompt("Max (opsional)", "") || "";
      payload.suffix = suffix || null;
      payload.min = min ? Number(min) : null;
      payload.max = max ? Number(max) : null;
    }

    if (t === "text" || t === "currency") {
      const ph = window.prompt("Placeholder (opsional)", "") || "";
      payload.placeholder = ph || null;
    }

    // t === "image" tidak butuh pengaturan tambahan
    return payload;
  }

  async function addSection() {
    const title = window.prompt(`Judul Section (${activePeriod}):`);
    if (!title) return;

    try {
      const res = await fetch(SECTION_BASE + "?feature=checklist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          title,
          role_key: (roleView ?? myRole)!,
          period: activePeriod,
        }),
      });
      const raw = await res.text();
      let j: any = null;
      try {
        j = JSON.parse(raw);
      } catch {}
      if (!res.ok) return alert((j && j.error) || "Gagal tambah section");
      const newId = j?.section?.id as string | undefined;
      await refreshSections(newId);
    } catch {
      alert("Gagal tambah section (client).");
    }
  }

  async function renameSection(sec: { id: string; title: string }) {
    const title = window.prompt("Ubah judul:", sec.title);
    if (title == null || title === sec.title) return;
    try {
      const res = await fetch(`${SECTION_BASE}/${sec.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ title }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return alert(j?.error || "Gagal update section");
      await refreshSections(sec.id);
    } catch {
      alert("Gagal update section (client).");
    }
  }

  async function deleteSection(sec: { id: string; title: string }) {
    if (
      !confirm(`Hapus section "${sec.title}"? Semua field akan ikut terhapus.`)
    )
      return;
    try {
      const res = await fetch(`${SECTION_BASE}/${sec.id}`, {
        method: "DELETE",
        headers: { "Cache-Control": "no-store" },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return alert(j?.error || "Gagal hapus section");
      await refreshSections();
    } catch {
      alert("Gagal hapus section (client).");
      await refreshSections();
    }
  }

  async function addField(sectionId: string) {
    const typeRaw =
      window.prompt(
        `Tipe field?
- radio
- checkbox
- number
- text
- currency
- invoice         (list faktur: nomor, customer, jumlah, alasan)
- image           (Upload foto)
- cycle_table     (Penugasan Cycle Count: Gudang / PIC / Principal + Deadline)
- text+           (Text multi item dengan tombol +)
- po_delay        (PO yang belum datang > Tanggal Permintaan Datang)
- model_principal (Model "Penerimaan Barang dari Prinsipal")
- COMBO: contoh  radio+number, checkbox+currency, radio+text+number`,
        "text"
      ) || "";

    const inputRaw = typeRaw.trim().toLowerCase();
    if (!inputRaw) return;

    // ======== FIELD KHUSUS: Penugasan Cycle Count ========
    if (inputRaw === "cycle_assign") {
      const label =
        window.prompt(
          "Judul field penugasan cycle count:",
          "Penugasan Cycle Count Hari Ini"
        ) || "Penugasan Cycle Count Hari Ini";

      const gk = uid();

      // field utama: ditandai placeholder "model:cycle"
      await createOne({
        section_id: sectionId,
        type: "text",
        label,
        help: null,
        group_key: gk,
        group_label: label,
        group_order: 1,
        placeholder: "model:cycle_count",
      });

      // otomatis tawarkan Keterangan di kanan
      if (window.confirm('Tambahkan field "Keterangan" di sebelah kanan?')) {
        const ketPayload = await promptPartPayload(sectionId, "text", {
          group_key: gk,
          group_label: label,
          order: 99,
          defaultLabel: "Keterangan",
        });
        await createOne(ketPayload);
      }

      await refreshSections(sectionId);
      return;
    }

    const isTextPlus = inputRaw === "text+";
    const isModel = inputRaw === "model_principal" || inputRaw === "model";

    // ======== JALUR KHUSUS: MODEL PRINSIPAL ========
    if (isModel) {
      const gk = uid();

      // Field daftar (multi+) dengan penanda "model:prinsipal"
      const daftarPayload = {
        section_id: sectionId,
        type: "text",
        label: "Penerimaan Barang dari Prinsipal",
        help: null,
        group_key: gk,
        group_label: "Penerimaan Barang dari Prinsipal",
        group_order: 1,
        placeholder: "multi+ model:prinsipal",
      };

      // Field keterangan di kolom kanan (order 99)
      const ketPayload = {
        section_id: sectionId,
        type: "text",
        label: "Keterangan",
        help: null,
        group_key: gk,
        group_label: "Penerimaan Barang dari Prinsipal",
        group_order: 99,
        placeholder: "Tambahkan catatan/keterangan",
      };

      await createOne(daftarPayload);
      await createOne(ketPayload);
      await refreshSections(sectionId);
      return;
    }

    // ======== JALUR UMUM ========
    const parts = (isTextPlus ? "text" : inputRaw)
      .split("+")
      .map((s) => s.trim())
      .filter(Boolean);

    const allowed = new Set([
      "radio",
      "checkbox",
      "number",
      "text",
      "currency",
      "invoice",
      "image",
      "cycle_table", // ⬅️ NEW
      "po_delay",
      "model_principal",
      "model",
    ]);

    if (!parts.every((p) => allowed.has(p))) {
      return alert(
        "Tipe tidak valid. Pakai: radio | checkbox | number | text | currency | invoice | image | po_delay | model_principal. Khusus multi text gunakan: text+"
      );
    }

    // ===== single part =====
    if (parts.length === 1) {
      const label = (window.prompt("Label field:", "Nama field") || "").trim();
      if (!label) return alert("Label wajib diisi");

      const wantNote =
        parts[0] !== "invoice" &&
        parts[0] !== "image" && // image tidak perlu keterangan otomatis
        window.confirm('Tambahkan "Keterangan" (text) di sebelah field ini?');
      const gk = wantNote ? uid() : undefined;

      // Map po_delay → text + placeholder default
      const createType = parts[0] === "po_delay" ? "text" : parts[0];

      const p1 = await promptPartPayload(sectionId, createType, {
        group_key: gk,
        group_label: wantNote ? label : null,
        order: 1,
        defaultLabel: label,
      });

      if (parts[0] === "po_delay" && !p1.placeholder) {
        p1.placeholder = "PO Delay";
      }

      if (isTextPlus && p1.type === "text") {
        const ph = String(p1.placeholder ?? "");
        if (!ph.toLowerCase().includes("multi+")) {
          p1.placeholder = (ph ? `multi+ ${ph}` : "multi+").trim();
        }
      }

      await createOne(p1);

      if (wantNote) {
        const notePayload = await promptPartPayload(sectionId, "text", {
          group_key: gk,
          group_label: label,
          order: 99,
          defaultLabel: "Keterangan",
        });
        await createOne(notePayload);
      }

      await refreshSections(sectionId);
      return;
    }

    // ===== COMBO =====
    const groupTitle = (
      window.prompt("Judul/label grup:", "Nama Grup") || ""
    ).trim();
    if (!groupTitle) return alert("Judul grup wajib diisi");

    const gk = uid();
    try {
      for (let i = 0; i < parts.length; i++) {
        const t = parts[i];
        const isFirst = i === 0;
        const def = isFirst ? groupTitle : t === "text" ? "Keterangan" : "";

        const payload = await promptPartPayload(sectionId, t, {
          group_key: gk,
          group_label: groupTitle,
          order: i + 1,
          defaultLabel: def,
        });
        await createOne(payload);
      }

      if (
        !parts.includes("invoice") &&
        !parts.includes("image") &&
        window.confirm('Tambah field "Keterangan" (text) di grup ini?')
      ) {
        const notePayload = await promptPartPayload(sectionId, "text", {
          group_key: gk,
          group_label: groupTitle,
          order: 99,
          defaultLabel: "Keterangan",
        });
        await createOne(notePayload);
      }

      await refreshSections(sectionId);
    } catch (e: any) {
      alert(e?.message || "Gagal menambah combo");
    }
  }

  async function editField(sectionId: string, f: any) {
    const nextLabel = window.prompt("Ubah label:", f.label)?.trim();
    if (nextLabel == null) return;

    const nextHelp = window.prompt(
      "Ubah keterangan (opsional):",
      (f as any).help ?? ""
    );
    const patch: any = {
      label: nextLabel,
      help: (nextHelp || "").trim() || null,
    };

    if (String(f.type) === "radio" || String(f.type) === "checkbox") {
      const existing = asOptions(f).join("|");
      const raw =
        window.prompt('Ubah opsi (pisah dengan "|"):', existing) ?? existing;
      patch.options = raw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const res = await fetch(`${FIELDS_API}/${(f as any).id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(patch),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal update field");
    await refreshSections(sectionId);
  }

  async function deleteField(sectionId: string, fieldId: string) {
    if (!confirm("Hapus field ini?")) return;

    const res = await fetch(`${FIELDS_API}/${fieldId}`, {
      method: "DELETE",
      headers: { "Cache-Control": "no-store" },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal menghapus field");

    await refreshSections(sectionId);
  }

  // Helper label grup
  function getGroupLabel(arr: any[]): string {
    const first: any = arr?.[0] ?? {};
    return (first.group_label ?? first.label ?? "").toString();
  }

  return (
    <main className="bg-slate-50 pb-24 input-black">
      {/* Header */}
      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4 no-print">
        <div className="flex items-start">
          <SuperAdminToggle
            active={canDesign}
            busy={superBusy}
            onEnable={enableSuperAdmin}
            onDisable={disableSuperAdmin}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Leader</label>
          <input
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            placeholder="Nama leader"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Depo</label>
          <input
            value={depo}
            onChange={(e) => setDepo(e.target.value)}
            placeholder="Nama depo"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-800">
              Checklist Area
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Template & nilai dipisah per periode.
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(myRole && ELEVATED.has(myRole)) || canDesign ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Role
                </label>
                <select
                  value={roleView ?? ""}
                  onChange={(e) => setRoleView(e.target.value || null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-black ring-1 ring-blue-100">
              Terisi: {filledCount}/{totalFields}
            </div>

            {canDesign && (
              <button
                onClick={openScheduleEditor}
                disabled={!(roleView ?? myRole)}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                title="Atur tanggal mingguan/bulanan yang dibuka"
              >
                <Shield className="h-4 w-4" /> Atur Tanggal
              </button>
            )}

            {canDesign && (
              <button
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                <Plus className="h-4 w-4" /> Section
              </button>
            )}
            <button
              onClick={saveAllAndReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Simpan Semua
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Tabs periode */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "daily", label: "Harian" },
              { key: "weekly", label: "Mingguan" },
              { key: "monthly", label: "Bulanan" },
            ].map((t) => {
              const k = t.key as Period;
              const active = activePeriod === k;
              return (
                <button
                  key={k}
                  onClick={() => {
                    setActivePeriod(k);
                  }}
                  className={
                    "inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm ring-1 transition " +
                    (active
                      ? "bg-blue-600 text-white ring-blue-600"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50")
                  }
                  title={t.label}
                >
                  <CalendarDays className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Periode aktif: <b>{activePeriod}</b>
          </div>

          {lockedGlobal && activePeriod !== "daily" && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Form <b>{activePeriod}</b> terkunci untuk tanggal{" "}
              <b>{normDate(date)}</b>. Jadwal dibuka pada:
              <ul className="mt-1 list-disc pl-5">
                {(activePeriod === "weekly"
                  ? schedules.weekly
                  : schedules.monthly
                ).map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Section switcher */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-600 mb-2">
            Section ({activePeriod})
          </div>
          <div className="flex flex-wrap gap-2">
            {(sections ?? []).map((s, i) => {
              const active = i === currentIdx;
              const lockedThis = lockedFor(s);

              return (
                <div key={s.id} className="flex items-center gap-1">
                  <button
                    onClick={() => jumpTo(i)}
                    className={
                      "rounded-2xl px-3 py-1.5 text-sm ring-1 transition " +
                      (active
                        ? "bg-blue-600 text-white ring-blue-600"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50")
                    }
                    title={s.title}
                  >
                    {s.title}{" "}
                    {activePeriod === "weekly" && lockedThis ? "🔒" : ""}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between no-print">
        <button
          onClick={goPrev}
          disabled={!(currentIdx > 0)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <div className="text-sm text-slate-600">
          Section {currentIdx + 1} dari {sections?.length || 0} ({activePeriod})
        </div>
        <button
          onClick={goNext}
          disabled={!(currentIdx < (sections?.length ?? 0) - 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="grid gap-6 no-print">
        {sections?.[currentIdx] ? (
          (() => {
            const sec = sections[currentIdx];
            const lockedSec = lockedFor(sec); // ⬅️ tambahkan baris ini
            return (
              <section
                key={sec.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {canDesign && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        renameSection({ id: sec.id, title: sec.title })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      title="Ubah judul section"
                    >
                      <Pencil className="h-3 w-3" /> Ubah
                    </button>

                    <button
                      onClick={() => addField(sec.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
                      title="Tambah field"
                    >
                      <Plus className="h-3 w-3" /> Field
                    </button>
                    {/* === NEW: atur whitelist tanggal khusus section (weekly only) === */}
                    {activePeriod === "weekly" && (
                      <button
                        onClick={() => editSectionWeeklyOpen(sec)}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700"
                        title="Atur tanggal khusus saat section ini dibuka (weekly)"
                      >
                        Tanggal Section
                      </button>
                    )}
                    <button
                      onClick={() =>
                        deleteSection({ id: sec.id, title: sec.title })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      title="Hapus section"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>

                    {canReorderSections && (
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => moveSection(sec.id, -1)}
                          disabled={currentIdx === 0}
                          className="text-[11px] px-2 py-1 rounded-lg bg-black text-white disabled:opacity-40 hover:bg-black/90"
                          title="Naikkan section ini"
                        >
                          ▲ Naik
                        </button>
                        <button
                          onClick={() => moveSection(sec.id, 1)}
                          disabled={currentIdx === (sections?.length ?? 1) - 1}
                          className="text-[11px] px-2 py-1 rounded-lg bg-black text-white disabled:opacity-40 hover:bg-black/90"
                          title="Turunkan section ini"
                        >
                          ▼ Turun
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-5">
                  {(() => {
                    // Bentuk groups
                    const groups: Record<string, any[]> = {};
                    for (const f of sec.fields ?? []) {
                      const key = (f as any).group_key || (f as any).id;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(f);
                    }

                    // Urut grup
                    const orderedGroups = Object.values(groups)
                      .map((arr) => {
                        const sorted = [...arr].sort(
                          (a: any, b: any) =>
                            (a.group_order ?? 0) - (b.group_order ?? 0)
                        );
                        const orderIndex = Math.min(
                          ...sorted.map((it: any, i: number) =>
                            Number.isFinite(it.idx) ? it.idx : i
                          )
                        );
                        (sorted as any)._orderIndex = orderIndex;
                        return sorted;
                      })
                      .sort(
                        (a: any, b: any) =>
                          (a as any)._orderIndex - (b as any)._orderIndex
                      );

                    // Map tiap grup (item)
                    return orderedGroups.map((arr: any[]) => {
                      const leftParts = arr.filter(
                        (f: any) => (f.group_order ?? 0) !== 99
                      );
                      const notePart = arr.find(
                        (f: any) => (f.group_order ?? 0) === 99
                      );
                      const noteId = (notePart as any)?.id as
                        | string
                        | undefined;
                      const groupId =
                        (arr[0] as any).group_key || (arr[0] as any).id;

                      return (
                        <div
                          key={groupId}
                          className="rounded-xl border border-slate-200 p-4 md:p-5"
                        >
                          {/* Toolbar judul + urutan per-grup */}
                          {canDesign && (
                            <div className="mb-3 flex items-center justify-between no-print">
                              <div className="text-sm font-semibold text-slate-800">
                                {getGroupLabel(arr)}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => moveGroup(sec.id, groupId, -1)}
                                  className="text-[11px] px-2 py-1 rounded-lg bg-black text-white hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/40"
                                  title="Naikkan item ini"
                                >
                                  ▲ Naik
                                </button>
                                <button
                                  onClick={() => moveGroup(sec.id, groupId, 1)}
                                  className="text-[11px] px-2 py-1 rounded-lg bg-black text-white hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/40"
                                  title="Turunkan item ini"
                                >
                                  ▼ Turun
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="md:grid md:grid-cols-[1fr_380px] gap-8">
                            {/* LEFT: render semua field */}
                            <div className="flex flex-col gap-4">
                              {leftParts.map((f: any) => (
                                <FieldInput
                                  key={(f as any).id}
                                  secId={sec.id}
                                  f={f}
                                  val={
                                    form[sec.id]?.[(f as any).id] ??
                                    (String((f as any).type) === "invoice"
                                      ? []
                                      : isMultiField(f)
                                      ? []
                                      : (f as any).type === "checkbox"
                                      ? []
                                      : (f as any).type === "number" ||
                                        (f as any).type === "currency"
                                      ? 0
                                      : "")
                                  }
                                  setVal={setVal}
                                  canDesign={canDesign}
                                  onEdit={() => editField(sec.id, f as any)}
                                  onDelete={() =>
                                    deleteField(sec.id, (f as any).id)
                                  }
                                  hideLabel={false}
                                  disabled={lockedSec}
                                />
                              ))}
                            </div>

                            {/* RIGHT: Keterangan */}
                            <div className="mt-2 md:mt-0 md:self-center md:pl-10">
                              {notePart ? (
                                String((notePart as any)?.type || "") ===
                                "text" ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <label className="block text-xs font-medium text-black">
                                        {(notePart as any).label ||
                                          "Keterangan"}
                                      </label>

                                      {canDesign && noteId && (
                                        <button
                                          onClick={() =>
                                            deleteField(sec.id, noteId)
                                          }
                                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 no-print"
                                          title="Hapus Keterangan saja"
                                        >
                                          <Trash2 className="h-3 w-3" /> Hapus
                                        </button>
                                      )}
                                    </div>

                                    <textarea
                                      value={String(
                                        form[sec.id]?.[noteId!] ?? ""
                                      )}
                                      onChange={(e) =>
                                        !lockedSec &&
                                        noteId &&
                                        setVal(sec.id, noteId, e.target.value)
                                      }
                                      placeholder={
                                        (notePart as any).placeholder ??
                                        "Tambahkan catatan/keterangan"
                                      }
                                      rows={4}
                                      disabled={lockedSec}
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 resize-vertical disabled:opacity-60"
                                    />
                                  </>
                                ) : (
                                  <FieldInput
                                    secId={sec.id}
                                    f={notePart as any}
                                    val={
                                      noteId ? form[sec.id]?.[noteId] ?? "" : ""
                                    }
                                    setVal={setVal}
                                    canDesign={canDesign}
                                    onEdit={() =>
                                      editField(sec.id, notePart as any)
                                    }
                                    onDelete={() =>
                                      noteId && deleteField(sec.id, noteId)
                                    }
                                    hideLabel={false}
                                    disabled={lockedSec}
                                  />
                                )
                              ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                                  (Tidak ada keterangan)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {(sec.fields ?? []).length === 0 && (
                    <div className="text-xs text-slate-500">
                      Belum ada field di section ini. Tambah field lewat tombol
                      custom-mu atau halaman admin.
                    </div>
                  )}
                </div>

                {/* tombol simpan pindah ke atas (toolbar) */}
                {lockedSec ? (
                  <div className="mt-6 text-xs text-slate-500">
                    Section ini terkunci pada tanggal ini.
                  </div>
                ) : null}
              </section>
            );
          })()
        ) : (
          <div className="text-sm text-slate-500">
            Belum ada section pada periode ini.
          </div>
        )}
      </div>

      {/* PRINT */}
      {/* PRINT */}
      <div className="hidden print:block">
        <PrintModelPrincipal sections={sections} form={form} />
      </div>

      <style jsx global>{`
        .input-black input,
        .input-black select,
        .input-black textarea {
          color: #000;
        }
        .input-black input::placeholder,
        .input-black textarea::placeholder {
          color: #000;
          opacity: 0.6;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          @page {
            size: A4 portrait;
            margin: 14mm 12mm;
          }
        }
      `}</style>
    </main>
  );
}

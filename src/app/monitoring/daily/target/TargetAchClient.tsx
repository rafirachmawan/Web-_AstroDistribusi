"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  Loader2,
  Save,
  Edit3,
  Plus,
  Trash2,
  X,
  Check,
  Lock,
} from "lucide-react";

/* =========================
   Types & Const
========================= */
type SectionKey = "klaim_bulanan" | "laporan_mingguan" | "fodkis";

type RowMonthly = { item: string; target?: string; selesai?: boolean };
type RowWeekly = {
  item: string;
  minggu1?: boolean;
  minggu2?: boolean;
  minggu3?: boolean;
  minggu4?: boolean;
};

type DailyTargetRow = {
  id?: string;
  month: string;
  section: SectionKey;
  item: string | null;
  target: string | null;
  selesai: boolean | null;
  minggu1: boolean | null;
  minggu2: boolean | null;
  minggu3: boolean | null;
  minggu4: boolean | null;
  created_by?: string | null;
};

type TargetItem = {
  id?: string;
  section: Extract<SectionKey, "klaim_bulanan" | "laporan_mingguan">;
  label: string;
  idx: number;
  created_by?: string | null;
};

const DEFAULT_MONTH_ITEMS = ["FRI", "SPJ", "APA", "WPL"];
const DEFAULT_WEEK_ITEMS = ["FRI", "SPJ", "APA", "WPL"];

/* =========================
   Helpers
========================= */
function toMonthStr(d = new Date()) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}
function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

/* =========================
   Component
========================= */
export default function TargetAchClient({
  isSuperDefault = false,
}: {
  isSuperDefault?: boolean;
}) {
  const [month, setMonth] = useState<string>(toMonthStr());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");

  // super admin (server) + verifikasi password (server)
  const [isSuper, setIsSuper] = useState<boolean>(!!isSuperDefault);
  const [verified, setVerified] = useState<boolean>(false);

  // dev bypass (opsional)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const qp = new URLSearchParams(window.location.search).get("super");
      if (qp === "1") setIsSuper(true);
    }
  }, []);
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/super/verify", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ verified: false }));
      setVerified(!!r?.verified);
    })();
  }, []);

  // daftar item aktif
  const [monthItems, setMonthItems] = useState<string[]>(DEFAULT_MONTH_ITEMS);
  const [weekItems, setWeekItems] = useState<string[]>(DEFAULT_WEEK_ITEMS);

  // state modal kelola item
  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdErr, setPwdErr] = useState<string | null>(null);
  const [savingItems, setSavingItems] = useState(false);
  const [draftMonthItems, setDraftMonthItems] = useState<string[]>([]);
  const [draftWeekItems, setDraftWeekItems] = useState<string[]>([]);
  const newInputRef = useRef<HTMLInputElement | null>(null);

  // data nilai
  const [klaim, setKlaim] = useState<Record<string, RowMonthly>>({});
  const [laporan, setLaporan] = useState<Record<string, RowWeekly>>({});
  const [fodkis, setFodkis] = useState<boolean>(false);

  // ambil daftar item + nilai
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const supabase = supabaseBrowser();

      const { data: itemRows } = await supabase
        .from("daily_target_items")
        .select("*")
        .in("section", ["klaim_bulanan", "laporan_mingguan"])
        .order("idx", { ascending: true })
        .returns<TargetItem[]>();

      const mItems =
        itemRows
          ?.filter((x) => x.section === "klaim_bulanan")
          .map((x) => x.label) ?? DEFAULT_MONTH_ITEMS;
      const wItems =
        itemRows
          ?.filter((x) => x.section === "laporan_mingguan")
          .map((x) => x.label) ?? DEFAULT_WEEK_ITEMS;

      if (!ignore) {
        setMonthItems(mItems.length ? mItems : DEFAULT_MONTH_ITEMS);
        setWeekItems(wItems.length ? wItems : DEFAULT_WEEK_ITEMS);
      }

      const { data } = await supabase
        .from("daily_targets")
        .select("*")
        .eq("month", month)
        .returns<DailyTargetRow[]>();

      if (ignore) return;

      const nextKlaim: Record<string, RowMonthly> = {};
      (mItems.length ? mItems : DEFAULT_MONTH_ITEMS).forEach(
        (i) => (nextKlaim[i] = { item: i, target: "", selesai: false })
      );

      const nextLaporan: Record<string, RowWeekly> = {};
      (wItems.length ? wItems : DEFAULT_WEEK_ITEMS).forEach(
        (i) =>
          (nextLaporan[i] = {
            item: i,
            minggu1: false,
            minggu2: false,
            minggu3: false,
            minggu4: false,
          })
      );

      let nextFodkis = false;

      (data || []).forEach((row) => {
        if (
          row.section === "klaim_bulanan" &&
          row.item &&
          nextKlaim[row.item]
        ) {
          nextKlaim[row.item] = {
            item: row.item,
            target: row.target ?? "",
            selesai: !!row.selesai,
          };
        } else if (
          row.section === "laporan_mingguan" &&
          row.item &&
          nextLaporan[row.item]
        ) {
          nextLaporan[row.item] = {
            item: row.item,
            minggu1: !!row.minggu1,
            minggu2: !!row.minggu2,
            minggu3: !!row.minggu3,
            minggu4: !!row.minggu4,
          };
        } else if (row.section === "fodkis") {
          nextFodkis = !!row.selesai;
        }
      });

      setKlaim(nextKlaim);
      setLaporan(nextLaporan);
      setFodkis(nextFodkis);
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [month]);

  // debounce simpan
  const debouncedSave = useMemo(() => {
    let t: any;
    return (fn: () => Promise<void>) => {
      setSaving("saving");
      clearTimeout(t);
      t = setTimeout(async () => {
        await fn();
        setSaving("saved");
        setTimeout(() => setSaving("idle"), 900);
      }, 350);
    };
  }, []);

  // upsert ke supabase
  async function upsertRow(row: Partial<DailyTargetRow>) {
    const supabase = supabaseBrowser();
    await supabase.from("daily_targets").upsert(row, {
      onConflict: "month,section,item",
    });
  }

  /* ========== handlers ========== */
  function handleTargetChange(item: string, v: string) {
    setKlaim((s) => ({ ...s, [item]: { ...s[item], target: v } }));
    debouncedSave(() =>
      upsertRow({ month, section: "klaim_bulanan", item, target: v })
    );
  }
  function handleKlaimCheck(item: string, v: boolean) {
    setKlaim((s) => ({ ...s, [item]: { ...s[item], selesai: v } }));
    debouncedSave(() =>
      upsertRow({ month, section: "klaim_bulanan", item, selesai: v })
    );
  }
  function handleWeekly(
    item: string,
    key: keyof Omit<RowWeekly, "item">,
    v: boolean
  ) {
    setLaporan((s) => ({ ...s, [item]: { ...s[item], [key]: v } }));
    debouncedSave(() =>
      upsertRow({ month, section: "laporan_mingguan", item, [key]: v } as any)
    );
  }
  function handleFodkis(v: boolean) {
    setFodkis(v);
    debouncedSave(() =>
      upsertRow({ month, section: "fodkis", item: null, selesai: v })
    );
  }

  // === Super Admin flow ===
  function openEditor() {
    setDraftMonthItems([...monthItems]);
    setDraftWeekItems([...weekItems]);
    setEditOpen(true);
  }
  function tryOpenEditor() {
    if (!isSuper) return;
    if (verified) openEditor();
    else setPwdOpen(true);
  }
  async function submitPassword() {
    setPwdErr(null);
    const res = await fetch("/api/super/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false }));
    if (res?.ok) {
      setVerified(true);
      setPwdOpen(false);
      setPwd("");
      openEditor();
    } else {
      setPwdErr("Password salah. Coba lagi.");
    }
  }

  // draft ops
  function addDraft(type: "month" | "week") {
    if (type === "month") setDraftMonthItems((s) => [...s, ""]);
    else setDraftWeekItems((s) => [...s, ""]);
    setTimeout(() => newInputRef.current?.focus(), 0);
  }
  function removeDraft(type: "month" | "week", idx: number) {
    if (type === "month")
      setDraftMonthItems((s) => s.filter((_, i) => i !== idx));
    else setDraftWeekItems((s) => s.filter((_, i) => i !== idx));
  }
  function changeDraft(type: "month" | "week", idx: number, v: string) {
    if (type === "month")
      setDraftMonthItems((s) => s.map((x, i) => (i === idx ? v : x)));
    else setDraftWeekItems((s) => s.map((x, i) => (i === idx ? v : x)));
  }
  function moveDraft(type: "month" | "week", idx: number, dir: "up" | "down") {
    const arr = type === "month" ? [...draftMonthItems] : [...draftWeekItems];
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    if (type === "month") setDraftMonthItems(arr);
    else setDraftWeekItems(arr);
  }

  // tutup modal & kunci lagi (hapus cookie verifikasi)
  async function closeAndLock() {
    setEditOpen(false);
    try {
      await fetch("/api/super/lock", { method: "POST" });
    } catch {}
    setVerified(false);
  }

  async function saveItemsToSupabase() {
    setSavingItems(true);
    const supabase = supabaseBrowser();

    await supabase
      .from("daily_target_items")
      .delete()
      .eq("section", "klaim_bulanan");
    await supabase
      .from("daily_target_items")
      .delete()
      .eq("section", "laporan_mingguan");

    if (draftMonthItems.length) {
      await supabase.from("daily_target_items").insert(
        draftMonthItems.map((label, idx) => ({
          section: "klaim_bulanan",
          label,
          idx,
        })) as TargetItem[]
      );
    }
    if (draftWeekItems.length) {
      await supabase.from("daily_target_items").insert(
        draftWeekItems.map((label, idx) => ({
          section: "laporan_mingguan",
          label,
          idx,
        })) as TargetItem[]
      );
    }

    setMonthItems(
      draftMonthItems.length ? draftMonthItems : DEFAULT_MONTH_ITEMS
    );
    setWeekItems(draftWeekItems.length ? draftWeekItems : DEFAULT_WEEK_ITEMS);
    setSavingItems(false);
    setMonth(toMonthStr(new Date(month + "-01"))); // trigger reload

    await closeAndLock(); // <-- kunci otomatis setelah simpan
  }

  return (
    <main className="bg-slate-50 pb-16">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        {/* Kiri: judul + bulan + saver */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Target &amp; Achievement
          </h1>

          <label className="ml-2 text-xs text-slate-700">Bulan</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <div
            className={cls(
              "hidden items-center gap-1 rounded-full px-3 py-1 text-xs",
              saving === "saving" && "md:flex bg-amber-100 text-amber-700",
              saving === "saved" && "md:flex bg-emerald-100 text-emerald-700"
            )}
          >
            {saving === "saving" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {saving === "saved" && <Save className="h-3.5 w-3.5" />}
            <span>
              {saving === "saving"
                ? "Menyimpan…"
                : saving === "saved"
                ? "Tersimpan!"
                : ""}
            </span>
          </div>
        </div>

        {/* Kanan: tombol super admin */}
        <div className="flex items-center gap-2">
          {isSuper && (
            <button
              onClick={tryOpenEditor}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Kelola item (Super Admin)"
            >
              <Edit3 className="h-4 w-4" />
              Super Admin
              {!verified && (
                <span className="ml-1 rounded-full bg-white/20 px-2 py-[2px] text-[10px]">
                  locked
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Card utama */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-900 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat data…
          </div>
        ) : (
          <>
            <h2 className="mb-3 rounded-xl bg-sky-600 px-4 py-2 text-white">
              Target &amp; Achievement
            </h2>

            {/* Penyelesaian Klaim Bulan Ini */}
            <div className="mb-6">
              <div className="mb-2 font-semibold text-slate-900">
                Penyelesaian Klaim Bulan Ini
                <span className="ml-2 text-xs font-normal text-slate-700">
                  (reset setiap awal bulan)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="text-xs text-slate-700">
                      <th className="w-36 border-b border-slate-200 px-3 py-2">
                        Item
                      </th>
                      <th className="w-[40%] border-b border-slate-200 px-3 py-2">
                        Target Selesai
                      </th>
                      <th className="w-28 border-b border-slate-200 px-3 py-2">
                        Selesai
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthItems.map((it) => (
                      <tr key={it} className="odd:bg-slate-50/40">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {it}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={klaim[it]?.target ?? ""}
                            onChange={(e) =>
                              handleTargetChange(it, e.target.value)
                            }
                            placeholder="Contoh: 20 klaim selesai"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-indigo-600"
                              checked={!!klaim[it]?.selesai}
                              onChange={(e) =>
                                handleKlaimCheck(it, e.target.checked)
                              }
                            />
                            <span className="text-slate-900">Selesai</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Laporan Mingguan */}
            <div className="mb-6">
              <div className="mb-2 font-semibold text-slate-900">
                Laporan Penjualan ke Prinsipal Mingguan
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="text-xs text-slate-700">
                      <th className="w-36 border-b border-slate-200 px-3 py-2">
                        Item
                      </th>
                      <th className="w-24 border-b border-slate-200 px-3 py-2">
                        Minggu 1
                      </th>
                      <th className="w-24 border-b border-slate-200 px-3 py-2">
                        Minggu 2
                      </th>
                      <th className="w-24 border-b border-slate-200 px-3 py-2">
                        Minggu 3
                      </th>
                      <th className="w-24 border-b border-slate-200 px-3 py-2">
                        Minggu 4
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekItems.map((it) => (
                      <tr key={it} className="odd:bg-slate-50/40">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {it}
                        </td>
                        {(
                          ["minggu1", "minggu2", "minggu3", "minggu4"] as const
                        ).map((col) => (
                          <td key={col} className="px-3 py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-indigo-600"
                              checked={!!(laporan[it] as any)?.[col]}
                              onChange={(e) =>
                                handleWeekly(it, col, e.target.checked)
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fodkis */}
            <div className="mb-2 font-semibold text-slate-900">
              Ketepatan Waktu Input Fodkis
            </div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={fodkis}
                onChange={(e) => handleFodkis(e.target.checked)}
              />
              <span className="text-slate-900">On Time</span>
            </label>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-700">
        Data otomatis tersimpan ke Supabase. Ganti bulan untuk melihat/ubah data
        bulan lain.
      </p>

      {/* ========== MODAL PASSWORD (Super Admin) ========== */}
      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center gap-2 text-slate-900">
              <Lock className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Masuk Mode Super Admin</h3>
            </div>
            <p className="mb-3 text-xs text-slate-700">
              Masukkan password untuk mengedit daftar item (berlaku 30 menit).
            </p>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Password super admin"
              className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {pwdErr && (
              <div className="mb-2 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {pwdErr}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setPwd("");
                  setPwdOpen(false);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={submitPassword}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Check className="h-4 w-4" /> Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= Modal Kelola Item (compact + scrollable) ======= */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Kelola Item (Super Admin)
              </h3>
              <button
                onClick={closeAndLock}
                className="rounded-md p-1.5 text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body (scrollable) */}
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-3">
              {[
                {
                  key: "month" as const,
                  title: "Item - Penyelesaian Klaim Bulan Ini",
                  data: draftMonthItems,
                },
                {
                  key: "week" as const,
                  title: "Item - Laporan Mingguan",
                  data: draftWeekItems,
                },
              ].map((grp) => (
                <div key={grp.key} className="mb-4">
                  <div className="mb-1 text-[13px] font-medium text-slate-900">
                    {grp.title}
                  </div>

                  <div className="rounded-md border border-slate-200">
                    {grp.data.length === 0 && (
                      <div className="px-3 py-2 text-[13px] text-slate-700">
                        Belum ada item.
                      </div>
                    )}

                    {grp.data.map((label, i) => (
                      <div
                        key={`${grp.key}-${i}`}
                        className="flex items-center gap-1.5 border-t border-slate-100 px-2 py-1.5 first:border-t-0"
                      >
                        {/* Urutan */}
                        <div className="flex items-center">
                          <button
                            onClick={() => moveDraft(grp.key, i, "up")}
                            className="rounded p-1 text-slate-700 hover:bg-slate-100"
                            title="Atas"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveDraft(grp.key, i, "down")}
                            className="rounded p-1 text-slate-700 hover:bg-slate-100"
                            title="Bawah"
                          >
                            ↓
                          </button>
                        </div>

                        {/* Input kecil */}
                        <input
                          ref={
                            i === grp.data.length - 1 ? newInputRef : undefined
                          }
                          value={label}
                          onChange={(e) =>
                            changeDraft(grp.key, i, e.target.value)
                          }
                          placeholder="Nama item…"
                          className="flex-1 h-8 rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        {/* Hapus kecil */}
                        <button
                          onClick={() => removeDraft(grp.key, i)}
                          className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addDraft(grp.key)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Item
                  </button>
                </div>
              ))}
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                onClick={closeAndLock}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                disabled={savingItems}
                onClick={saveItemsToSupabase}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {savingItems ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}{" "}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

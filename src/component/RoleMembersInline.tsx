"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";

/** Supabase REST setup */
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sbFetch(path: string, init: RequestInit = {}) {
  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    ...init.headers,
  } as any;
  return fetch(`${SB_URL}${path}`, { ...init, headers });
}

type Row = { id?: string; name: string; idx?: number; is_active?: boolean };

export default function RoleMembersInline({
  roleKey,
  canEdit,
  className = "",
  onSaved,
}: {
  roleKey: string;
  canEdit: boolean;
  className?: string;
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** Load daftar anggota dari role_members */
  async function load() {
    setLoading(true);
    const q = new URLSearchParams({
      select: "id,name,idx,is_active",
      role_key: `eq.${roleKey}`,
    });
    const r = await sbFetch(
      `/rest/v1/role_members?${q}&order=idx.asc&order=name.asc`,
      { cache: "no-store" }
    );
    const data: any[] = r.ok ? await r.json() : [];
    setRows(
      (data || []).map((d) => ({
        id: d.id,
        name: d.name,
        idx: d.idx ?? 0,
        is_active: d.is_active ?? true,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    if (!roleKey) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey]);

  const normalize = (arr: Row[]) =>
    arr.map((r, i) => ({
      ...r,
      idx: i + 1,
      is_active: r.is_active ?? true,
    }));

  const addRow = () =>
    setRows((p) => normalize([...p, { name: "", is_active: true }]));
  const delRow = (i: number) =>
    setRows((p) => normalize(p.filter((_, idx) => idx !== i)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const n = [...p];
      [n[i], n[j]] = [n[j], n[i]];
      return normalize(n);
    });
  const edit = (i: number, patch: Partial<Row>) =>
    setRows((p) => {
      const n = [...p];
      n[i] = { ...n[i], ...patch };
      return n;
    });

  /** SAVE: tanpa RPC – delete & insert ulang */
  const onSave = async () => {
    setSaving(true);
    try {
      const payload = normalize(
        rows
          .map((r) => ({
            name: (r.name || "").trim(),
            is_active: !!r.is_active,
          }))
          .filter((r) => r.name.length > 0)
      );

      // 1) Hapus semua anggota role ini
      const del = await sbFetch(
        `/rest/v1/role_members?role_key=eq.${encodeURIComponent(roleKey)}`,
        { method: "DELETE" }
      );
      if (!del.ok) {
        const txt = await del.text();
        throw new Error(`Gagal menghapus existing: ${txt}`);
      }

      if (payload.length) {
        // 2) Insert ulang berurutan (idx 1..n)
        const insertBody = payload.map((r, i) => ({
          role_key: roleKey,
          name: r.name,
          idx: i + 1,
          is_active: r.is_active,
        }));

        const ins = await sbFetch(`/rest/v1/role_members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(insertBody),
        });
        if (!ins.ok) {
          const txt = await ins.text();
          throw new Error(`Gagal insert: ${txt}`);
        }
      }

      alert("Anggota tersimpan.");
      onSaved?.();
      load(); // refresh list lokal
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan anggota.");
    } finally {
      setSaving(false);
    }
  };

  /** ===== Render ===== */
  if (loading) {
    return (
      <div className={className}>
        <span className="text-sm text-slate-500">Memuat anggota…</span>
      </div>
    );
  }

  // VIEW-ONLY: tampilkan chips anggota aktif
  if (!canEdit) {
    const active = rows.filter((r) => r.is_active);
    return (
      <div className={className + " flex flex-wrap gap-2"}>
        {active.length ? (
          active.map((r) => (
            <span
              key={r.id ?? r.name}
              className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
            >
              {r.name}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">
            Belum ada anggota aktif.
          </span>
        )}
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">
          Anggota dinilai
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
          >
            <Plus size={14} /> Tambah
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={14} /> {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={(r.id ?? "new") + i}
            className="grid grid-cols-[40px_1fr_120px_120px_90px] gap-2 items-center rounded-xl border p-2"
          >
            <div className="text-xs text-slate-500 text-center">
              {r.idx ?? i + 1}
            </div>
            <input
              value={r.name}
              onChange={(e) => edit(i, { name: e.target.value })}
              placeholder="Nama anggota…"
              className="border rounded-md px-2 py-1 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={r.is_active ?? true}
                onChange={(e) => edit(i, { is_active: e.target.checked })}
              />
              <span className="text-slate-700">Aktif</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(i, -1)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                title="Naik"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => move(i, +1)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                title="Turun"
              >
                <ArrowDown size={14} />
              </button>
            </div>
            <button
              onClick={() => delRow(i)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-rose-50"
              title="Hapus"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        ))}
        {!rows.length && (
          <div className="text-sm text-slate-500">
            Belum ada anggota. Klik “Tambah”.
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, Unlock, Loader2, Printer } from "lucide-react";

/* ======================
   Toggle Super Admin
====================== */
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
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
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
    <div className="flex items-center gap-2">
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

/* ======================
   Types sederhana
====================== */
type Kriteria = { id: string; label: string; idx: number };
type Anggota = { id: string; name: string; idx: number };

export default function EvaluasiClient({
  roleName, // ex: "Kepala Admin"
  roleKey, // ex: "kepala_admin"
  tanggalDefault, // ex: "2025-10-14"
  kriteria, // daftar kriteria (dari template role)
  anggota, // daftar anggota default (dari template role)
}: {
  roleName: string;
  roleKey: string;
  tanggalDefault: string;
  kriteria: Kriteria[];
  anggota: Anggota[];
}) {
  /* ======================
     State form header
  ====================== */
  const [date, setDate] = useState<string>(tanggalDefault);
  const [leader, setLeader] = useState("");
  const [depo, setDepo] = useState("");

  /* ======================
     Super Admin & akses
  ====================== */
  const ELEVATED = new Set(["it", "hrd", "direktur"]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [canDesign, setCanDesign] = useState(false);
  const [superBusy, setSuperBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/whoami", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        const rk = j?.profile?.role_key ?? null;
        setMyRole(rk);

        // cek status super admin
        let active = false;
        try {
          const s = await fetch("/api/super-admin/status", {
            cache: "no-store",
          });
          const sj = await s.json().catch(() => null);
          active = !!sj?.active;
        } catch {}
        setCanDesign(active || ELEVATED.has(rk));
      } catch {}
    })();
  }, []);

  async function enableSuperAdmin() {
    const pwd = window.prompt("Masukkan password Super Admin");
    if (!pwd) return;
    setSuperBusy(true);
    try {
      const res = await fetch("/api/super-admin/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return alert(j?.error || "Gagal mengaktifkan");
      setCanDesign(true);
      window.location.reload();
    } finally {
      setSuperBusy(false);
    }
  }
  async function disableSuperAdmin() {
    setSuperBusy(true);
    try {
      await fetch("/api/super-admin/disable", { method: "POST" });
      setCanDesign(ELEVATED.has(myRole || ""));
      window.location.reload();
    } finally {
      setSuperBusy(false);
    }
  }

  /* ======================
     Data tabel (kriteria & anggota)
     – default dari props, bisa diubah saat canDesign
  ====================== */
  const [rows, setRows] = useState<Kriteria[]>(() =>
    [...kriteria].sort((a, b) => a.idx - b.idx)
  );
  const [cols, setCols] = useState<Anggota[]>(() =>
    [...anggota].sort((a, b) => a.idx - b.idx)
  );

  // nilai evaluasi: map[kriteriaId][anggotaId] = 1..5 (atau 0 kalau kosong)
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    {}
  );

  useEffect(() => {
    // inisialisasi kosong jika belum ada
    const draft: Record<string, Record<string, number>> = {};
    for (const r of rows) {
      draft[r.id] = {};
      for (const c of cols) draft[r.id][c.id] = 0;
    }
    setScores((prev) => ({ ...draft, ...prev }));
  }, [rows, cols]);

  function setScore(kId: string, aId: string, v: number) {
    setScores((prev) => ({
      ...prev,
      [kId]: { ...(prev[kId] || {}), [aId]: v },
    }));
  }

  /* ======================
     Desain (super admin / elevated)
     – CRUD ringan kriteria & anggota (frontend)
  ====================== */
  function addKriteria() {
    if (!canDesign) return;
    const label = prompt("Nama kriteria:")?.trim();
    if (!label) return;
    const id = crypto.randomUUID();
    const idx = rows.length;
    setRows((r) => [...r, { id, label, idx }]);
  }
  function renameKriteria(k: Kriteria) {
    if (!canDesign) return;
    const label = prompt("Ubah nama kriteria:", k.label)?.trim();
    if (!label || label === k.label) return;
    setRows((rs) => rs.map((x) => (x.id === k.id ? { ...x, label } : x)));
  }
  function deleteKriteria(k: Kriteria) {
    if (!canDesign) return;
    if (!confirm(`Hapus kriteria "${k.label}"?`)) return;
    setRows((rs) => rs.filter((x) => x.id !== k.id));
    setScores((prev) => {
      const next = { ...prev };
      delete next[k.id];
      return next;
    });
  }

  function addAnggota() {
    if (!canDesign) return;
    const name = prompt("Nama anggota:")?.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    const idx = cols.length;
    setCols((c) => [...c, { id, name, idx }]);
  }
  function renameAnggota(a: Anggota) {
    if (!canDesign) return;
    const name = prompt("Ubah nama anggota:", a.name)?.trim();
    if (!name || name === a.name) return;
    setCols((cs) => cs.map((x) => (x.id === a.id ? { ...x, name } : x)));
  }
  function deleteAnggota(a: Anggota) {
    if (!canDesign) return;
    if (!confirm(`Hapus anggota "${a.name}"?`)) return;
    setCols((cs) => cs.filter((x) => x.id !== a.id));
    setScores((prev) => {
      const next: typeof prev = {};
      for (const kId of Object.keys(prev)) {
        const row = { ...(prev[kId] || {}) };
        delete row[a.id];
        next[kId] = row;
      }
      return next;
    });
  }

  /* ======================
     Hitung ringkas
  ====================== */
  const totalNilai = useMemo(() => {
    let t = 0;
    let cnt = 0;
    for (const r of rows) {
      for (const c of cols) {
        const v = scores[r.id]?.[c.id] ?? 0;
        if (v > 0) {
          t += v;
          cnt++;
        }
      }
    }
    return { t, cnt, rata: cnt ? (t / cnt).toFixed(2) : "0.00" };
  }, [scores, rows, cols]);

  /* ======================
     Simpan (placeholder)
     – ganti dengan endpoint Anda sendiri
  ====================== */
  async function saveForm() {
    if (!date) return alert("Tanggal wajib diisi.");
    if (!leader.trim()) return alert("Leader wajib diisi.");
    if (!depo.trim()) return alert("Depo wajib diisi.");

    const payload = {
      role_key: roleKey,
      role_name: roleName,
      form_date: date,
      leader,
      depo,
      rows,
      cols,
      scores,
    };
    console.log("SAVE Evaluasi =>", payload);

    // TODO: ganti endpoint ini sesuai backend Anda
    // const res = await fetch("/api/monitoring/daily/evaluasi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    // const j = await res.json().catch(() => ({}));
    // if (!res.ok) return alert(j?.error || "Gagal menyimpan");
    alert("Tersimpan!");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="bg-slate-50 pb-24 input-black">
      {/* Header form */}
      <div className="mb-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div className="flex items-start">
          <SuperAdminToggle
            active={canDesign}
            busy={superBusy}
            onEnable={enableSuperAdmin}
            onDisable={disableSuperAdmin}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-900">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-900">Leader</label>
          <input
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            placeholder="Nama leader"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-900">Depo</label>
          <input
            value={depo}
            onChange={(e) => setDepo(e.target.value)}
            placeholder="Nama depo"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Role label + toolbar kecil */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">
          Role: {roleName}
        </div>
        <div className="flex items-center gap-2">
          {canDesign && (
            <>
              <button
                onClick={addKriteria}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                + Kriteria
              </button>
              <button
                onClick={addAnggota}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                + Anggota
              </button>
            </>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            title="Cetak / Simpan PDF"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Tabel Evaluasi */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-900">
          Evaluasi Tim
        </div>

        <div className="w-full overflow-auto">
          <table className="min-w-[800px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-slate-900">
                  Kriteria
                </th>
                {cols.map((a) => (
                  <th
                    key={a.id}
                    className="border border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <span>{a.name}</span>
                      {canDesign && (
                        <>
                          <button
                            onClick={() => renameAnggota(a)}
                            className="text-xs text-slate-600 underline underline-offset-2"
                            title="Ubah nama"
                          >
                            ubah
                          </button>
                          <button
                            onClick={() => deleteAnggota(a)}
                            className="text-xs text-rose-600 underline underline-offset-2"
                            title="Hapus"
                          >
                            hapus
                          </button>
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="sticky left-0 z-10 border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{r.label}</span>
                      {canDesign && (
                        <>
                          <button
                            onClick={() => renameKriteria(r)}
                            className="text-xs text-slate-600 underline underline-offset-2"
                            title="Ubah label"
                          >
                            ubah
                          </button>
                          <button
                            onClick={() => deleteKriteria(r)}
                            className="text-xs text-rose-600 underline underline-offset-2"
                            title="Hapus kriteria"
                          >
                            hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  {cols.map((a) => {
                    const v = scores[r.id]?.[a.id] ?? 0;
                    return (
                      <td
                        key={a.id}
                        className="border border-slate-300 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-slate-900">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <label
                              key={n}
                              className="inline-flex items-center gap-1 text-sm"
                            >
                              <input
                                type="radio"
                                name={`${r.id}_${a.id}`}
                                checked={v === n}
                                onChange={() => setScore(r.id, a.id, n)}
                              />
                              {n}
                            </label>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ringkas & Simpan */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-900">
            Total Nilai Terisi:{" "}
            <span className="font-semibold">{totalNilai.t}</span> • Item Terisi:{" "}
            <span className="font-semibold">{totalNilai.cnt}</span> • Rata-rata:{" "}
            <span className="font-semibold">{totalNilai.rata}</span>
          </div>
          <button
            onClick={saveForm}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Global Styles: bikin teks input/placeholder hitam */}
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
          html,
          body {
            background: #fff !important;
          }
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
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}

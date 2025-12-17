"use client";

import { useEffect, useMemo, useState } from "react";

/** ===== Types ===== */
export type RoleKey =
  | "kepala_admin"
  | "kepala_gudang"
  | "spv"
  | "sales_manager"
  | "bsdc"
  | "hrd"
  | "direktur"
  | "it";

export interface Criterion {
  id: string;
  label: string;
  help?: string | null;
  idx?: number | null;
}

export interface Member {
  id: string;
  name: string;
  idx?: number | null;
}

/** a row-major score map: memberId -> (criterionId -> score) */
type ScoreMap = Record<string, Record<string, number>>;
type NoteMap = Record<string, string>;

/** ===== Component ===== */
export default function TeamEvaluationClient() {
  const [roleView, setRoleView] = useState<RoleKey | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [notes, setNotes] = useState<NoteMap>({});
  const [busyTpl, setBusyTpl] = useState(false);

  /** Load template (criteria + members) for a role */
  async function loadTemplate(rkey: RoleKey | null) {
    setBusyTpl(true);
    try {
      const u = new URL(
        "/api/monitoring/evaluasi/template",
        window.location.origin
      );
      if (rkey) u.searchParams.set("role", rkey);

      const res = await fetch(u.toString(), { cache: "no-store" });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        criteria?: Criterion[];
        members?: Member[];
        error?: string;
      } | null;

      if (!res.ok || !j) {
        alert(j?.error || "Gagal load template");
        return;
      }

      const crits: Criterion[] = Array.isArray(j.criteria) ? j.criteria : [];
      const mems: Member[] = Array.isArray(j.members) ? j.members : [];

      setCriteria(crits);
      setMembers(mems);

      // reset nilai dengan tipe aman
      const sc: ScoreMap = {};
      const nt: NoteMap = {};

      mems.forEach((m: Member) => {
        sc[m.id] = {};
        crits.forEach((c: Criterion) => {
          sc[m.id][c.id] = 0;
        });
        nt[m.id] = "";
      });

      setScores(sc);
      setNotes(nt);
    } finally {
      setBusyTpl(false);
    }
  }

  // initial role (optional)
  useEffect(() => {
    // set default role here if needed, e.g. "kepala_admin"
    setRoleView("kepala_admin");
  }, []);

  useEffect(() => {
    if (roleView) loadTemplate(roleView);
  }, [roleView]);

  /** UI rendering afterwards… */
  return (
    <div className="space-y-4">
      {/* Simple role picker (you can hide/show based on canDesign) */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Role</label>
        <select
          className="rounded-md border px-3 py-1.5"
          value={roleView ?? ""}
          onChange={(e) => setRoleView(e.target.value as RoleKey)}
          disabled={busyTpl}
        >
          <option value="kepala_admin">Kepala Admin</option>
          <option value="kepala_gudang">Kepala Gudang</option>
          <option value="spv">SPV</option>
          <option value="sales_manager">Sales Manager</option>
          <option value="bsdc">BSDC</option>
          <option value="hrd">HRD</option>
          <option value="direktur">Direktur</option>
          <option value="it">IT</option>
        </select>
      </div>

      {/* Table header */}
      <div className="overflow-auto rounded-lg border">
        <table className="min-w-[800px] w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border px-3 py-2 text-left text-sm font-semibold text-black">
                Kriteria
              </th>
              {members.map((m) => (
                <th
                  key={m.id}
                  className="border px-3 py-2 text-left text-sm font-semibold text-black"
                >
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.id}>
                <td className="border px-3 py-2 text-sm text-black">
                  {c.label}
                </td>
                {members.map((m) => (
                  <td key={m.id} className="border px-3 py-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const checked = scores[m.id]?.[c.id] === s;
                        return (
                          <label
                            key={s}
                            className="inline-flex items-center gap-1 text-sm text-black"
                          >
                            <input
                              type="radio"
                              name={`${m.id}-${c.id}`}
                              checked={checked}
                              onChange={() =>
                                setScores((prev) => ({
                                  ...prev,
                                  [m.id]: { ...(prev[m.id] || {}), [c.id]: s },
                                }))
                              }
                            />
                            {s}
                          </label>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes per member */}
      <div className="grid gap-3 md:grid-cols-3">
        {members.map((m) => (
          <div key={m.id} className="rounded-lg border p-3">
            <div className="mb-1 text-sm font-semibold text-black">
              Catatan — {m.name}
            </div>
            <textarea
              className="w-full rounded-md border p-2 text-sm text-black"
              rows={3}
              value={notes[m.id] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({
                  ...prev,
                  [m.id]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

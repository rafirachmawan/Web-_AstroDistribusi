"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  Loader2,
  SquarePen,
  Copy,
  CheckCircle2,
  Shield,
  Users,
} from "lucide-react";

/* Editor anggota inline (hanya dipakai saat edit ON) */
import RoleMembersInline from "../../../../../component/RoleMembersInline";

/* ===== Types ===== */
type RoleKey =
  | "kepala_admin"
  | "kepala_gudang"
  | "spv"
  | "sales_manager"
  | "bsdc"
  | "hrd"
  | "direktur"
  | "it";

type Section = { id: string; title: string; idx: number };
type Field = {
  id: string;
  section_id: string;
  label: string;
  help?: string | null;
  type: string;
  idx: number;
  group_key?: string | null;
  group_label?: string | null;
  group_order?: number | string | null;
  options?: number[] | string[] | null;
};
type Member = { id: string; name: string; idx: number; is_active: boolean };
type EtForm = {
  id: string;
  form_date: string;
  role_key: RoleKey;
  leader: string | null;
  depo: string | null;
};

const FEATURE_KEY = "eval_team";
const ROLE_OPTIONS: { key: RoleKey; name: string }[] = [
  { key: "kepala_admin", name: "Kepala Admin" },
  { key: "kepala_gudang", name: "Kepala Gudang" },
  { key: "spv", name: "SPV" },
  { key: "sales_manager", name: "Sales Manager" },
  { key: "bsdc", name: "BSDC" },
  { key: "hrd", name: "HRD" },
  { key: "direktur", name: "Direktur" },
  { key: "it", name: "IT" },
];
const ROLE_NAME = new Map(ROLE_OPTIONS.map((r) => [r.key, r.name]));

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function readIsSuper() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim() === "super_admin=1");
}

/* ===== Page ===== */
export default function EvaluasiRolePage() {
  const params = useParams<{ role: RoleKey }>();
  const roleParam = params?.role as RoleKey;
  const router = useRouter();
  const search = useSearchParams();
  const supabase = supabaseBrowser();

  const [dateISO, setDateISO] = useState(search.get("date") || todayISO());
  const [myRole, setMyRole] = useState<RoleKey | null>(null);

  // Super admin state
  const [isSuper, setIsSuper] = useState<boolean>(readIsSuper());
  const [editMode, setEditMode] = useState<boolean>(false);
  const [superOpen, setSuperOpen] = useState<boolean>(false);
  const [superPass, setSuperPass] = useState<string>("");

  // UI role (kalau super + editMode bisa beda dgn roleParam)
  const [designRole, setDesignRole] = useState<RoleKey>(roleParam);

  // data template + nilai
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [loadingEt, setLoadingEt] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [etForm, setEtForm] = useState<EtForm | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeMember, setActiveMember] = useState<string>("");

  // persist date on URL
  useEffect(() => {
    const q = new URLSearchParams(search.toString());
    q.set("date", dateISO);
    router.replace(`?${q.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  /* ====== Ambil role user dan redirect jika perlu ====== */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/whoami", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        const rk = (j?.profile?.role_key || null) as RoleKey | null;
        setMyRole(rk);

        if (!readIsSuper() && rk && roleParam !== rk) {
          router.replace(`/monitoring/daily/evaluasi/${rk}?date=${dateISO}`);
        } else {
          setDesignRole(roleParam);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleParam]);

  /* ====== Load TEMPLATE (tergantung apakah super sedang mengedit) ====== */
  const loadTemplate = async (targetRole: RoleKey) => {
    setLoadingTpl(true);

    const secRes = await fetch(
      `/api/monitoring/daily/eval-sections?feature=${FEATURE_KEY}&role=${targetRole}&withFields=1`,
      { cache: "no-store" }
    );
    const secJson = await secRes.json().catch(() => null);
    const secs = (secJson?.sections || []) as Section[];

    const flds = secs.flatMap((s: any) =>
      (s.fields || []).map((f: any) => ({ ...f, section_id: s.id }))
    ) as Field[];

    const memRes = await fetch(
      `/api/monitoring/daily/eval-role-members?role=${targetRole}`,
      { cache: "no-store" }
    );
    const memJson = await memRes.json().catch(() => null);
    const mems = (memJson?.members || []) as Member[];

    setSections(secs);
    setFields(flds);
    setMembers(mems);

    // set default active member jika belum terpilih
    if (!activeMember && mems.length) setActiveMember(mems[0].name);

    setLoadingTpl(false);
  };

  /* ====== Load NILAI (selalu untuk role di URL) ====== */
  const loadEtForm = async () => {
    setLoadingEt(true);
    const { data: forms } = await supabase
      .from("et_forms")
      .select("id, form_date, role_key, leader, depo")
      .eq("form_date", dateISO)
      .eq("role_key", roleParam)
      .limit(1);

    let form: EtForm | null = forms?.[0] || null;
    if (!form) {
      const { data: ins } = await supabase
        .from("et_forms")
        .insert({ form_date: dateISO, role_key: roleParam })
        .select()
        .single();
      form = (ins as any) || null;
    }
    setEtForm(form);

    if (form) {
      const { data: vals } = await supabase
        .from("et_values")
        .select("field_id, member, score")
        .eq("form_id", form.id);
      const map: Record<string, number> = {};
      (vals || []).forEach(
        (v) => (map[`${v.field_id}:${v.member}`] = v.score as number)
      );
      setScores(map);
    } else {
      setScores({});
    }
    setLoadingEt(false);
  };

  // (re)load template saat role UI (target) berubah
  useEffect(() => {
    const target = isSuper && editMode ? designRole : roleParam;
    loadTemplate(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designRole, roleParam, editMode, isSuper]);

  // (re)load nilai saat ganti tanggal/role URL
  useEffect(() => {
    loadEtForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleParam, dateISO]);

  // set default active member kalau list berubah
  useEffect(() => {
    if (!activeMember && members.length) setActiveMember(members[0].name);
  }, [members, activeMember]);

  // group fields per section
  const grouped = useMemo(() => {
    const bySec: Record<
      string,
      { section: Section; rows: Field[]; descs: Field[] }
    > = {};
    sections.forEach(
      (s) => (bySec[s.id] = { section: s, rows: [], descs: [] })
    );

    fields.forEach((f) => {
      if (!bySec[f.section_id]) return;
      const goRaw = f.group_order;
      const go =
        typeof goRaw === "number"
          ? goRaw
          : Number.isNaN(Number(goRaw))
          ? undefined
          : Number(goRaw);

      if (go === 99) bySec[f.section_id].descs.push(f);
      else bySec[f.section_id].rows.push(f);
    });

    return Object.values(bySec).sort((a, b) => a.section.idx - b.section.idx);
  }, [sections, fields]);

  const setScore = (field_id: string, member: string, score: number) => {
    setScores((prev) => ({ ...prev, [`${field_id}:${member}`]: score }));
  };

  const saveScores = async () => {
    if (!etForm) return;
    setSaving(true);
    const payload = Object.entries(scores)
      .filter(([, val]) => typeof val === "number")
      .map(([k, val]) => {
        const [field_id, member] = k.split(":");
        return { form_id: etForm.id, field_id, member, score: val as number };
      });

    if (payload.length) {
      await supabase.from("et_values").upsert(payload, {
        onConflict: "form_id,field_id,member",
        ignoreDuplicates: false,
      });
    }
    setSaving(false);
  };

  /* ===== CRUD via API (dipertahankan) ===== */
  async function reloadTemplate() {
    const target = isSuper && editMode ? designRole : roleParam;
    await loadTemplate(target);
  }

  async function addSection() {
    if (!editMode) return;
    const title = (window.prompt("Judul section baru:") || "").trim();
    if (!title) return;
    const res = await fetch("/api/monitoring/daily/eval-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        feature: FEATURE_KEY,
        role_key: designRole,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal membuat section");
    reloadTemplate();
  }

  async function renameSection(s: Section) {
    if (!editMode) return;
    const title = window.prompt("Ubah judul section:", s.title);
    if (!title || title === s.title) return;
    const res = await fetch(
      `/api/monitoring/daily/eval-sections?id=${encodeURIComponent(s.id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal ubah judul");
    reloadTemplate();
  }

  async function deleteSection(s: Section) {
    if (!editMode) return;
    if (!confirm(`Hapus section "${s.title}" beserta kriterianya?`)) return;
    const res = await fetch(
      `/api/monitoring/daily/eval-sections?id=${encodeURIComponent(s.id)}`,
      { method: "DELETE" }
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal hapus section");
    reloadTemplate();
  }

  async function addCriterionRow(section_id: string) {
    if (!editMode) return;
    const res = await fetch("/api/monitoring/daily/eval-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id,
        label: "Kriteria baru",
        type: "radio",
        options: [1, 2, 3, 4, 5],
        idx: 999,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal tambah kriteria");
    reloadTemplate();
  }

  async function addDescription(section_id: string) {
    if (!editMode) return;
    const res = await fetch("/api/monitoring/daily/eval-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id,
        label: "Deskripsi/Pertanyaan",
        type: "text",
        group_order: 99,
        idx: 999,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal tambah deskripsi");
    reloadTemplate();
  }

  async function editField(f: Field) {
    if (!editMode) return;
    const label = window.prompt("Ubah label:", f.label ?? "") ?? f.label ?? "";
    const help =
      window.prompt("Ubah deskripsi (opsional):", f.help ?? "") ??
      f.help ??
      null;
    const res = await fetch(
      `/api/monitoring/daily/eval-fields?id=${encodeURIComponent(f.id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, help }),
      }
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal update field");
    reloadTemplate();
  }

  async function deleteField(f: Field) {
    if (!editMode) return;
    if (!confirm(`Hapus kriteria "${f.label}"?`)) return;
    const res = await fetch(
      `/api/monitoring/daily/eval-fields?id=${encodeURIComponent(f.id)}`,
      { method: "DELETE" }
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal hapus field");
    reloadTemplate();
  }

  async function cloneFromKepalaAdmin() {
    if (!editMode || designRole === "kepala_admin") return;
    alert("Copy dari Kepala Admin: belum diaktifkan di versi ini.");
  }

  // super admin auth
  async function trySuperLogin() {
    const res = await fetch("/api/super-admin/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: superPass }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error || "Password salah");
      return;
    }
    setIsSuper(true);
    setEditMode(true);
    setSuperOpen(false);
    setSuperPass("");
    await reloadTemplate();
  }

  function superLogout() {
    fetch("/api/super-admin/disable", { method: "POST" }).finally(() => {
      document.cookie = "super_admin=; path=/; max-age=0";
      setIsSuper(false);
      setEditMode(false);
      setDesignRole(roleParam);
      reloadTemplate();
    });
  }

  /* ===== Render ===== */
  if (loadingTpl || loadingEt) {
    return (
      <main className="p-6 text-black">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-2">
            <Loader2 className="animate-spin" /> Memuat evaluasi…
          </div>
        </div>
      </main>
    );
  }

  // role yang dipakai untuk mengelola anggota saat UI edit
  const targetRoleForMembers: RoleKey =
    isSuper && editMode ? designRole : roleParam;
  const canEditMembers = isSuper && editMode;

  return (
    <main className="bg-slate-50 min-h-screen pb-24 text-black">
      {/* Kontrol atas */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Users className="w-4 h-4" /> <span>Anggota dinilai:</span>
            </div>

            {/* EDITOR anggota hanya saat super admin + Edit ON */}
            {canEditMembers ? (
              <div className="w-full">
                <RoleMembersInline
                  roleKey={targetRoleForMembers}
                  canEdit={true}
                  onSaved={reloadTemplate}
                  className="mt-2"
                />
              </div>
            ) : (
              // VIEW biasa: chips anggota aktif + pilihan aktifMember
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMember(m.name)}
                    className={`rounded-2xl px-3 py-1.5 text-sm ring-1 transition ${
                      activeMember === m.name
                        ? "bg-blue-600 text-white ring-blue-600"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="ms-auto flex items-center gap-2">
              {!isSuper ? (
                <button
                  onClick={() => setSuperOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Shield className="w-4 h-4" /> Super Admin
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Dropdown UI Role hanya kalau super admin */}
                  <label className="text-xs text-slate-600">UI Role:</label>
                  <select
                    value={designRole}
                    onChange={(e) => setDesignRole(e.target.value as RoleKey)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Shield className="h-3 w-3" /> Aktif
                  </span>
                  <button
                    onClick={() => setEditMode((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 ${
                      editMode ? "ring-2 ring-amber-400" : ""
                    }`}
                  >
                    <SquarePen className="w-4 h-4" />{" "}
                    {editMode ? "Edit ON" : "Edit OFF"}
                  </button>
                  <button
                    onClick={superLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    Keluar
                  </button>
                  {designRole !== "kepala_admin" && (
                    <button
                      onClick={cloneFromKepalaAdmin}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Copy className="w-4 h-4" /> Copy dari Kepala Admin
                    </button>
                  )}
                  <button
                    onClick={addSection}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    + Section
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-600">
            <div>
              <span className="font-semibold">Penilaian</span> disimpan untuk:{" "}
              {ROLE_NAME.get(roleParam)} (tanggal: {dateISO})
            </div>
            {isSuper && (
              <div>
                <span className="font-semibold">Sedang mengedit UI</span> untuk:{" "}
                {ROLE_NAME.get(designRole)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-4 mt-4 space-y-8">
        {grouped.map(({ section, rows, descs }) => (
          <section
            key={section.id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">{section.title}</h2>
              {isSuper && editMode && (
                <div className="ms-auto flex items-center gap-2">
                  <button
                    onClick={() => addCriterionRow(section.id)}
                    className="text-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-700 hover:bg-amber-100"
                  >
                    + Kriteria
                  </button>
                  <button
                    onClick={() => addDescription(section.id)}
                    className="text-sm rounded-xl border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
                  >
                    + Deskripsi
                  </button>
                  <button
                    onClick={() => renameSection(section)}
                    className="text-sm rounded-xl border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
                  >
                    Ubah Judul
                  </button>
                  <button
                    onClick={() => deleteSection(section)}
                    className="text-sm rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-100"
                  >
                    Hapus Section
                  </button>
                </div>
              )}
            </header>

            {/* Deskripsi */}
            {descs.length > 0 && (
              <div className="px-5 py-3 text-sm space-y-3">
                {descs.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-slate-800">
                        {d.label}
                      </div>
                      {d.help ? (
                        <div className="text-xs mt-0.5">{d.help}</div>
                      ) : null}
                    </div>
                    {isSuper && editMode && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editField(d)}
                          className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-0.5 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteField(d)}
                          className="text-xs rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700 hover:bg-rose-100"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Fallback bila rows kosong */}
            {rows.length === 0 && (
              <div className="px-5 py-3 text-sm text-slate-500">
                Tidak ada kriteria pada section ini. (Cek data: <i>type</i>{" "}
                harus <b>radio</b> untuk penilaian 1–5, dan <i>group_order</i> ={" "}
                <b>99</b> khusus deskripsi)
              </div>
            )}

            {/* Kriteria per anggota */}
            {rows.length > 0 && (
              <div className="px-5 py-4">
                <div className="mb-3 text-sm">
                  Menilai:{" "}
                  <span className="font-semibold">
                    {activeMember || "(pilih anggota)"}
                  </span>
                </div>
                <div className="grid gap-3">
                  {rows.map((r) => {
                    const value = scores[`${r.id}:${activeMember}`] || 0;
                    const isRadio = (r.type || "").toLowerCase() === "radio";
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="font-medium mb-1 text-slate-800 flex items-center gap-2">
                          <span>{r.label}</span>
                          {isSuper && editMode && (
                            <>
                              <button
                                onClick={() => editField(r)}
                                className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-0.5 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteField(r)}
                                className="text-xs rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700 hover:bg-rose-100"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                        {r.help && <div className="text-xs mb-2">{r.help}</div>}

                        {isRadio ? (
                          <div className="inline-flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                disabled={!etForm || saving || !activeMember}
                                onClick={() => setScore(r.id, activeMember, n)}
                                className={`w-8 h-8 rounded-lg ring-1 text-xs transition ${
                                  value === n
                                    ? "bg-blue-600 text-white ring-blue-600"
                                    : "bg-white ring-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-700">
                            (Tipe field bukan <b>radio</b> — ganti ke “radio”
                            agar bisa dinilai 1–5)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        ))}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={saveScores}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            disabled={saving}
          >
            <CheckCircle2 className="w-4 h-4" /> Simpan Nilai
          </button>
          {saving && (
            <span className="text-sm inline-flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin" /> menyimpan…
            </span>
          )}
        </div>
      </div>

      {/* Modal Super Admin */}
      {superOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-5 w-[92vw] max-w-md border border-slate-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
              <Shield className="w-4 h-4" /> Masuk Super Admin
            </h3>
            <input
              type="password"
              value={superPass}
              onChange={(e) => setSuperPass(e.target.value)}
              placeholder="Password"
              className="w-full border rounded-xl px-3 py-2 mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSuperOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={trySuperLogin}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

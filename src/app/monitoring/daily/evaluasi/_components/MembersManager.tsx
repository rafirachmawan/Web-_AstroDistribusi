"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Member = {
  id: string;
  name: string;
  idx: number;
  is_active: boolean;
};

export default function MembersManager({
  roleKey,
  canEdit,
  onChange,
}: {
  roleKey: string;
  canEdit: boolean;
  onChange?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/monitoring/daily/members?role=${roleKey}`, {
        cache: "no-store",
      });
      const j = await r.json();
      setMembers(j?.members ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (roleKey) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey]);

  async function addMember() {
    const name = window.prompt("Nama anggota:");
    if (!name) return;
    const res = await fetch(`/api/monitoring/daily/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_key: roleKey, name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal menambah anggota");
    await load();
    onChange?.();
  }

  async function renameMember(m: Member) {
    const name = window.prompt("Ubah nama:", m.name);
    if (name == null || name === m.name) return;
    const res = await fetch(`/api/monitoring/daily/members/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal ubah nama");
    await load();
    onChange?.();
  }

  async function removeMember(m: Member) {
    if (!confirm(`Hapus anggota "${m.name}"?`)) return;
    const res = await fetch(`/api/monitoring/daily/members/${m.id}`, {
      method: "DELETE",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j?.error || "Gagal hapus anggota");
    await load();
    onChange?.();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {loading ? (
        <span className="text-xs text-slate-500">Memuat…</span>
      ) : members.length === 0 ? (
        <span className="text-xs text-slate-500">Belum ada anggota.</span>
      ) : (
        members.map((m) => (
          <div
            key={m.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
            title={`Urutan: ${m.idx}`}
          >
            <span>{m.name}</span>
            {canEdit && (
              <>
                <button
                  className="text-slate-600 hover:text-slate-900"
                  onClick={() => renameMember(m)}
                  title="Ubah nama"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="text-rose-600 hover:text-rose-800"
                  onClick={() => removeMember(m)}
                  title="Hapus"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))
      )}

      {canEdit && (
        <button
          onClick={addMember}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          title="Tambah anggota"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
      )}
    </div>
  );
}

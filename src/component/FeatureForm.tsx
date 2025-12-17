"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchTemplates, type Field, type Section } from "@/lib/templates";

export default function FeatureForm({ feature }: { feature: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTemplates(feature)
      .then(({ sections, fields }) => {
        setSections(sections);
        setFields(fields);
      })
      .finally(() => setLoading(false));
  }, [feature]);

  const grouped = useMemo(() => {
    const by: Record<string, Field[]> = {};
    for (const f of fields) {
      if (!by[f.section_id]) by[f.section_id] = [];
      by[f.section_id].push(f);
    }
    return by;
  }, [fields]);

  function setVal(fieldId: string, v: any) {
    setValues((prev) => ({ ...prev, [fieldId]: v }));
  }

  async function onSubmit() {
    const payload = { fields: values };
    const res = await fetch("/api/feature-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature_key: feature, payload }),
    });
    if (!res.ok) alert("Gagal menyimpan");
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.id} className="rounded-xl border p-4 space-y-3">
          <div className="font-semibold">{s.title}</div>
          {(grouped[s.id] || []).map((f) => (
            <div key={f.id} className="space-y-1">
              <label className="block text-sm">{f.label}</label>
              {f.type === "text" && (
                <input
                  className="w-full border rounded p-2"
                  value={values[f.id] || ""}
                  onChange={(e) => setVal(f.id, e.target.value)}
                />
              )}
              {f.type === "textarea" && (
                <textarea
                  className="w-full border rounded p-2"
                  value={values[f.id] || ""}
                  onChange={(e) => setVal(f.id, e.target.value)}
                />
              )}
              {f.type === "number" && (
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={values[f.id] || ""}
                  onChange={(e) => setVal(f.id, Number(e.target.value))}
                />
              )}
              {f.type === "date" && (
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={values[f.id] || ""}
                  onChange={(e) => setVal(f.id, e.target.value)}
                />
              )}
              {f.type === "radio" && Array.isArray(f.options) && (
                <div className="flex gap-4 flex-wrap">
                  {f.options.map((opt: any) => (
                    <label
                      key={String(opt)}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={f.id}
                        checked={values[f.id] === opt}
                        onChange={() => setVal(f.id, opt)}
                      />
                      <span>{String(opt)}</span>
                    </label>
                  ))}
                </div>
              )}
              {f.type === "checkbox" && Array.isArray(f.options) && (
                <div className="flex gap-4 flex-wrap">
                  {f.options.map((opt: any) => {
                    const cur: any[] = Array.isArray(values[f.id])
                      ? values[f.id]
                      : [];
                    const checked = cur.includes(opt);
                    return (
                      <label
                        key={String(opt)}
                        className="inline-flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            let next = new Set(cur);
                            e.target.checked ? next.add(opt) : next.delete(opt);
                            setVal(f.id, Array.from(next));
                          }}
                        />
                        <span>{String(opt)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {f.type === "select" && Array.isArray(f.options) && (
                <select
                  className="w-full border rounded p-2"
                  value={values[f.id] || ""}
                  onChange={(e) => setVal(f.id, e.target.value)}
                >
                  <option value="">Pilih…</option>
                  {f.options.map((opt: any) => (
                    <option key={String(opt)} value={String(opt)}>
                      {String(opt)}
                    </option>
                  ))}
                </select>
              )}
              {f.type === "signature" && (
                <div className="border rounded p-4 text-sm text-slate-500">
                  /* pasang signature pad di sini */
                </div>
              )}
              {f.help && <p className="text-xs text-slate-500">{f.help}</p>}
            </div>
          ))}
        </div>
      ))}
      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={onSubmit}
      >
        Simpan
      </button>
    </div>
  );
}

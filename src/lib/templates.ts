export type Section = { id: string; title: string; idx: number };
export type Field = {
  id: string;
  section_id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "radio"
    | "checkbox"
    | "select"
    | "number"
    | "date"
    | "signature";
  options?: any;
  required?: boolean;
  help?: string;
  idx?: number;
};

export async function fetchTemplates(feature: string) {
  const res = await fetch(`/api/templates?feature=${feature}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("failed to load templates");
  return res.json() as Promise<{ sections: Section[]; fields: Field[] }>;
}

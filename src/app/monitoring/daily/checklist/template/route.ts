import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: sections } = await supabase
    .from("ml_checklist_sections")
    .select(
      "id,title,position, ml_checklist_fields ( id,label,type,options,suffix,min,max,help,position )"
    )
    .order("position", { ascending: true })
    .order("position", {
      foreignTable: "ml_checklist_fields",
      ascending: true,
    });

  return Response.json({ sections: sections || [] });
}

export async function POST(req: Request) {
  // Tambah section (SuperAdmin UI + RLS admin/hr/ops)
  const body = await req.json().catch(() => ({}));
  const { title } = body || {};
  if (!title) return Response.json({ error: "title kosong" }, { status: 400 });

  // boleh tampilkan UI hanya saat cookie SA aktif (opsional; RLS tetap jaga di DB)
  const sa = (await cookies()).get("super_admin")?.value === "1";
  if (!sa) return Response.json({ error: "Super Admin off" }, { status: 401 });

  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase
    .from("ml_checklist_sections")
    .insert({ title })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ section: data });
}

export async function PATCH(req: Request) {
  // Rename section
  const body = await req.json().catch(() => ({}));
  const { id, title } = body || {};
  if (!id || !title)
    return Response.json({ error: "id/title kosong" }, { status: 400 });

  const sa = (await cookies()).get("super_admin")?.value === "1";
  if (!sa) return Response.json({ error: "Super Admin off" }, { status: 401 });

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase
    .from("ml_checklist_sections")
    .update({ title })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}

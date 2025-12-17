import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabase } from "../../../../../../../../lib/supabase/server";

async function isSuper() {
  const jar = await cookies();
  return jar.get("super_admin")?.value === "1";
}

export async function DELETE(
  _req: Request,
  { params }: { params: { fieldId: string } }
) {
  if (!(await isSuper())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getServerSupabase();

  const { error } = await supabase
    .from("monitoring_fields")
    .delete()
    .eq("id", params.fieldId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

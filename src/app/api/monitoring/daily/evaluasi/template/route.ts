import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function requireRole(searchParams: URLSearchParams) {
  const role = searchParams.get("role")?.trim();
  if (!role) throw new Error("Missing role");
  return role;
}

/**
 * Response shape expected by TeamEvaluationClient:
 * {
 *   criteria: Array<{ id: string, label: string, idx: number }>,
 *   members:  Array<{ id: string, name: string, idx: number }>
 * }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = requireRole(searchParams);

    const supabase = await getServerSupabase();

    // Ambil semua section utk feature eval_team & role tsb
    const { data: sections, error: eSec } = await supabase
      .from("feature_sections")
      .select("id, title, idx")
      .eq("feature_key", "eval_team")
      .eq("role_key", role)
      .order("idx", { ascending: true });

    if (eSec) throw eSec;

    const found = sections ?? [];
    // Cari section khusus untuk anggota
    const memberSec = found.find((s) => s.title === "__members__");

    // Anggota (dari fields pada section __members__)
    let members: Array<{ id: string; name: string; idx: number }> = [];
    if (memberSec) {
      const { data: mfields, error: eMf } = await supabase
        .from("feature_fields")
        .select("id, label, idx")
        .eq("section_id", memberSec.id)
        .order("idx", { ascending: true });
      if (eMf) throw eMf;

      members =
        (mfields ?? []).map((f) => ({
          id: f.id as string,
          name: (f.label || "").trim(),
          idx: (f.idx ?? 0) as number,
        })) ?? [];
    }

    // Kriteria = semua section selain __members__
    const criteria =
      found
        .filter((s) => s.title !== "__members__")
        .map((s) => ({
          id: s.id as string,
          label: (s.title || "").trim(),
          idx: (s.idx ?? 0) as number,
        })) ?? [];

    return NextResponse.json({ criteria, members });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load template" },
      { status: 400 }
    );
  }
}

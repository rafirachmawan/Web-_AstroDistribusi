import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "astro123";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ok = String(body?.password || "") === PASSWORD;
  if (!ok)
    return NextResponse.json({ error: "Password salah" }, { status: 403 });

  const store = await cookies();
  store.set("super_admin", "1", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true });
}

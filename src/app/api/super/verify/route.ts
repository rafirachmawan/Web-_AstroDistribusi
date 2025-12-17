import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "super_edit_ok";
const MAX_AGE = 60 * 30; // 30 menit

export async function GET() {
  const jar = await cookies();
  const verified = jar.get(COOKIE_NAME)?.value === "1";
  return NextResponse.json({ verified });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = (body?.password ?? "").toString();

  const expected = process.env.SUPER_ADMIN_EDIT_PASS ?? "";
  const ok = expected.length > 0 && password === expected;

  const res = NextResponse.json({ ok });
  if (ok) {
    res.cookies.set(COOKIE_NAME, "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
    });
  }
  return res;
}

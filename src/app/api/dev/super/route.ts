import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const on = url.searchParams.get("on") === "1";
  const res = NextResponse.json({ ok: true, on });

  // secure hanya di production, supaya cookie terkirim di http://localhost
  res.cookies.set("super_admin", on ? "1" : "0", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: on ? 60 * 60 * 24 * 7 : 0,
  });

  return res;
}

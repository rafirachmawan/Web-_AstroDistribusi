import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true, locked: true });
  // hapus cookie verifikasi supaya terkunci lagi
  res.cookies.set("super_edit_ok", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return res;
}

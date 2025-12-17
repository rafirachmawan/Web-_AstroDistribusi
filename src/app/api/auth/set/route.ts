// src/app/api/auth/set/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}));
  if (!access_token || !refresh_token) {
    return NextResponse.json(
      { error: "access_token/refresh_token wajib" },
      { status: 400 }
    );
  }

  const jar = await cookies();

  // tulis cookie auth-nya (nama standar sb-...)
  jar.set({
    name: "sb-access-token",
    value: access_token,
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });
  jar.set({
    name: "sb-refresh-token",
    value: refresh_token,
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}

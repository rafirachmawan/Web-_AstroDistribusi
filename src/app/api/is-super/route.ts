import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const jar = await cookies();
  const isSuper = jar.get("super_admin")?.value === "1";
  return NextResponse.json({ isSuper });
}

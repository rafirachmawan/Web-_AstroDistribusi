import { NextResponse } from "next/server";

export const runtime = "nodejs"; // penting: harus Node

export async function GET() {
  return NextResponse.json({
    runtime: process.env.NEXT_RUNTIME ?? "node",
    hasSrv: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    srvEqAnon:
      process.env.SUPABASE_SERVICE_ROLE_KEY ===
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

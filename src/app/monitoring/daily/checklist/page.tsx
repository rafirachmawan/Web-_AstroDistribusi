// app/monitoring/daily/checklist/page.ts
import ChecklistClient from "./ChecklistClient";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // anti cache SSR

export default async function Page() {
  // kalau kamu punya flag super admin dari cookie/session, cek di sini
  // misal cookie "super_admin" = "1"
  const isSuper = (await cookies()).get("super_admin")?.value === "1";

  // == PENTING ==
  // Jangan SSR fetch sections/template di sini. Biar client yang load pakai role & period.
  return <ChecklistClient template={[]} canDesign={!!isSuper} />;
}

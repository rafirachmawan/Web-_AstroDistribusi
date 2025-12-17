// src/app/api/_utils/isSuper.ts
import { cookies as nextCookies } from "next/headers";
export async function isSuper() {
  const jar = await nextCookies();
  return jar.get("super_admin")?.value === "1";
}

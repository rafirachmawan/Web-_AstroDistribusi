import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/getProfile";
import { can } from "@/lib/authz";

export default async function ModuleGuard({
  mod,
  children,
}: {
  mod: "stok" | "salesman" | "pelatihan" | "monitoring" | "hrd";
  children: React.ReactNode;
}) {
  const { session, profile } = await getSessionAndProfile();

  if (!session) redirect("/login"); // safety – mestinya sudah ditahan middleware
  if (!can(profile as any, mod)) redirect("/403");

  return <>{children}</>;
}

import { cookies } from "next/headers";
import TargetAchClient from "./TargetAchClient";

export default async function Page() {
  const jar = await cookies();
  const isSuper = jar.get("super_admin")?.value === "1";
  return <TargetAchClient isSuperDefault={isSuper} />;
}

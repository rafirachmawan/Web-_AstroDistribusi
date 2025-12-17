import { getSessionAndProfile } from "@/lib/getProfile";
import { redirect } from "next/navigation";
import HomeLanding from "../component/home/HomeLanding";

export default async function Home() {
  const { session } = await getSessionAndProfile();
  // tetap private: kalau belum login arahkan ke /login
  if (!session) redirect("/login");

  // sudah login → tampilkan halaman Home (tanpa redirect ke modul)
  return <HomeLanding />;
}

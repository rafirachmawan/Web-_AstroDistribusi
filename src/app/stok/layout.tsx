import ModuleGuard from "../../component/ModuleGuard";
import StokShell from "../../component/StokShell";

export default async function StokLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard mod="stok">
      <StokShell>{children}</StokShell>
    </ModuleGuard>
  );
}

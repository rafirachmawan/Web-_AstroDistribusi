import "./globals.css";
import Navbar from "../component/Navbar"; // (CLIENT), fetch menu dari /api/nav

export const metadata = {
  title: "Astro Distribusi",
  description: "Sistem terintegrasi distribusi & sales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900">
        <Navbar /> {/* ← hanya di sini */}
        {children}
      </body>
    </html>
  );
}

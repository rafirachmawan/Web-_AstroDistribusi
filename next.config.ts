// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * WAJIB untuk Docker / Render / Railway
   * supaya build Next.js bisa jalan sebagai standalone server
   */
  output: "standalone",

  /**
   * Next 15:
   * ganti dari experimental.serverComponentsExternalPackages
   * ke serverExternalPackages
   * (hanya dipakai di server / Node.js)
   */
  serverExternalPackages: ["pdfkit", "fontkit"],

  // 👉 config lain kamu aman ditambahkan di sini nanti
};

export default nextConfig;

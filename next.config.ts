// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next 15: ganti dari experimental.serverComponentsExternalPackages
   * ke serverExternalPackages.
   * Pastikan semua paket di sini hanya dipakai di server (Node.js).
   */
  serverExternalPackages: ["pdfkit", "fontkit"],
  // tambahkan config lainmu di sini bila perlu
};

export default nextConfig;

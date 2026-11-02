import type { NextConfig } from "next";

process.env.TZ = "Asia/Jakarta";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

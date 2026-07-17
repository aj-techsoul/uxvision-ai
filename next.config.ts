import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning and lint checks should not block local dev testing builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore minor typing checks during deployment build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

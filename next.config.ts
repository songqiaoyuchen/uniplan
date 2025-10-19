import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Disable ESLint during `next build`
  eslint: {
    ignoreDuringBuilds: true,
  },

  // other options...
};

export default nextConfig;

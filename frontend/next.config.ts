import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error allowedDevOrigins is supported in Next.js 15+
  allowedDevOrigins: ["*.lhr.life", "*.loca.lt", "localhost:3000"],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${backendUrl}/static/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      {
        source: "/ready",
        destination: `${backendUrl}/ready`,
      },
    ];
  },
};

export default nextConfig;


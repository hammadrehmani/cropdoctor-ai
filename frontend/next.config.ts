import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.lhr.life", "*.loca.lt", "localhost:3000"],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8005";
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
  async redirects() {
    return [
      {
        source: "/ai-advisor",
        destination: "/advisor",
        permanent: true,
      },
      {
        source: "/chat",
        destination: "/advisor",
        permanent: true,
      },
      {
        source: "/crop",
        destination: "/crops",
        permanent: true,
      },
      {
        source: "/map",
        destination: "/risk-map",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


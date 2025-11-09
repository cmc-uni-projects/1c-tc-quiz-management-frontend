// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      // 1. Proxy for /teachers/* endpoints
      {
        // e.g. /teachers/all, /teachers/123/approve
        source: "/teachers/:path*",
        destination: "http://localhost:8082/teachers/:path*",
      },

      // 2. NEW: Proxy for /admin/* endpoints (admin-only actions like approve/reject)
      {
        source: "/admin/:path*",
        destination: "http://localhost:8082/admin/:path*",
      },

      // 3. Existing: /api/* endpoints
      {
        source: "/api/:path*",
        destination: "http://localhost:8082/api/:path*",
      },

      // 4. Existing: Proxy uploaded images
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8082/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;

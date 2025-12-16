// next.config.ts

import type { NextConfig } from "next";

console.log("Attempting to read BACKEND_URL:", process.env.BACKEND_URL);

const backendUrl = process.env.BACKEND_URL || "http://localhost:8082";

console.log("Using backend URL:", backendUrl);

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      // 1. Proxy for /teachers/* endpoints
      {
        // e.g. /teachers/all, /teachers/123/approve
        source: "/teachers/:path*",
        destination: `${backendUrl}/teachers/:path*`,
      },

      // 2. NEW: Proxy for /admin/* endpoints (admin-only actions like approve/reject)
      // REMOVED: Conflics with frontend routes
      /* {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      }, */


      // 3. Existing: /api/* endpoints
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },

      // 4. Existing: Proxy uploaded images
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },

      // 5. NEW: Proxy categories CRUD to backend Spring Boot
      {
        source: "/categories/:path*",
        destination: `${backendUrl}/categories/:path*`,
      },
    ];
  },
};

export default nextConfig;

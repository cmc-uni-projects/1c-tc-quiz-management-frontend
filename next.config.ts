import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8081/:path*",
      },
      // Proxy uploaded images to the Spring Boot backend
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8081/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
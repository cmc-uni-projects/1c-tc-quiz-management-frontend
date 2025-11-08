import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8082/:path*", // proxy API to Spring Boot
      },
      // Proxy password reset endpoints
      {
        source: "/forgot-password",
        destination: "http://localhost:8082/forgot-password",
      },
      {
        source: "/validate-token",
        destination: "http://localhost:8082/validate-token",
      },
      {
        source: "/reset-password",
        destination: "http://localhost:8082/reset-password",
      },
      // Proxy uploaded images to the Spring Boot backend
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8082/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;

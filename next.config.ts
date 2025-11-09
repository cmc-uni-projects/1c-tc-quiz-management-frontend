// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      // 1. QUY TẮC MỚI: Dành cho các endpoint /teachers/*
      {
        // Bất kỳ yêu cầu nào bắt đầu bằng /teachers/ (ví dụ: /teachers/all, /teachers/123/approve)
        source: "/teachers/:path*",
        // Chuyển tiếp đến Backend
        destination: "http://localhost:8082/teachers/:path*",
      },
      
      // 2. Giữ nguyên: Dành cho các endpoint /api/*
      {
        source: "/api/:path*",
        destination: "http://localhost:8082/api/:path*", 
      },
      
      // 3. Giữ nguyên: Proxy uploaded images
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8082/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://quizi.up.railway.app/api/:path*',
      },
    ]
  },
};

export default nextConfig;


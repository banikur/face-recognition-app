import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/admin/dashboard', destination: '/admin', permanent: true },
    ];
  },
  webpack: (config) => {
    // Fix for face-api.js fs issue
    config.resolve.alias = {
      ...config.resolve.alias,
      fs: false,
      path: false,
      crypto: false,
      buffer: false,
      stream: false,
    };
    
    return config;
  },
  // Add transpilePackages for face-api.js
  transpilePackages: ['face-api.js'],
};

export default nextConfig;
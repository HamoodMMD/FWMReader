import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  devIndicators: false,
  output: process.env.TAURI === "true" ? "export" : undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;

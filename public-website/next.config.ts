import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
};

export default nextConfig;

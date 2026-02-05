import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    // Ignore build errors during deployment (fix later)
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  turbopack: {
    root: __dirname,
  },
  // Transpile the @wapisgroup/accessibility-rules package
  transpilePackages: ['@wapisgroup/accessibility-rules'],
};

export default nextConfig;

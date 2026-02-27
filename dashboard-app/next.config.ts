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
  // Use eval-source-map in dev so stack traces in the firestore-read-tracker show
  // original TypeScript file paths instead of compiled chunk filenames.
  // Note: this webpack option is ignored when running with Turbopack (next dev --turbopack).
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

export default nextConfig;

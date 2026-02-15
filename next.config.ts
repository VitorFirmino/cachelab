import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable the webpack build worker: in some sandboxed/CI environments the worker can exit without
    // surfacing the underlying webpack error output.
    webpackBuildWorker: false,
  },
  cacheComponents: true,
  cacheLife: {
    featured: { stale: 120, revalidate: 180, expire: 3600 },
    products: { stale: 60, revalidate: 120, expire: 1800 },
    product: { stale: 120, revalidate: 300, expire: 3600 },
    events: { stale: 60, revalidate: 300, expire: 3600 },
    categories: { stale: 300, revalidate: 300, expire: 86400 },
  },
};

export default nextConfig;

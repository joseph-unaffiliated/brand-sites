import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
/** Parent folder has its own lockfile; pin Next to this monorepo so packages resolve. */
const monorepoRoot = path.join(appDir, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  transpilePackages: [
    "@publication-websites/affiliate",
    "@publication-websites/shared-ads",
    "@publication-websites/web-shell",
    "@publication-websites/sanity-content",
    "@publication-websites/magic-client",
    "@publication-websites/platform-redirects",
    "@publication-websites/sparkloop-client",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;

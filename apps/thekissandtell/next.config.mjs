/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@publication-websites/shared-ads",
    "@publication-websites/web-shell",
    "@publication-websites/sanity-content",
    "@publication-websites/magic-client",
    "@publication-websites/platform-redirects",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/sarah", destination: "/article/sarah", permanent: true },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@publication-websites/affiliate",
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
    return [{ source: "/archive", destination: "/recipes", permanent: true }];
  },
};

export default nextConfig;

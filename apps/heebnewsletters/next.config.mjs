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
    return [{ source: "/archive", destination: "/from-the-vault", permanent: true }];
  },
};

export default nextConfig;

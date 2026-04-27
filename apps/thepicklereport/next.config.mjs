/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Default cross-promo targets for this site; override in Vercel or `.env.local` if needed. */
  env: {
    NEXT_PUBLIC_SHARED_ADS_BRAND:
      process.env.NEXT_PUBLIC_SHARED_ADS_BRAND || "thepicklereport",
    NEXT_PUBLIC_SHARED_ADS_URL_RAIL:
      process.env.NEXT_PUBLIC_SHARED_ADS_URL_RAIL || "https://thepicklereport.com",
    NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE:
      process.env.NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE ||
      "https://thepicklereport.com/thepicklepriest",
    NEXT_PUBLIC_SHARED_ADS_URL_STICKY:
      process.env.NEXT_PUBLIC_SHARED_ADS_URL_STICKY || "https://thepicklereport.com/picklewar",
  },
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

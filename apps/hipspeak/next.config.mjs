/** Sent emails link to these short slugs; the Sanity entries use the long form. */
const EMAIL_SLUG_ALIASES = {
  clockit: "clock-it",
  hitdiff: "hit-different",
  sixsev: "six-seven",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return Object.entries(EMAIL_SLUG_ALIASES).flatMap(([from, to]) =>
      ["pollresults", "word"].map((route) => ({
        source: `/${route}/${from}`,
        destination: `/${route}/${to}`,
        permanent: true,
      })),
    );
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
};

export default nextConfig;

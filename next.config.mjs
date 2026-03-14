/** @type {import('next').NextConfig} */
const nextConfig = {
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

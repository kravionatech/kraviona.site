import type { NextConfig } from "next";

const noIndexHeader = { key: "X-Robots-Tag", value: "noindex" };

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      { source: "/services", destination: "/blog", permanent: true },
      { source: "/guest-posting", destination: "/blog", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/newsletter/confirm",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      { source: "/feed.xml", headers: [noIndexHeader] },
      { source: "/sitemap.xml", headers: [noIndexHeader] },
      { source: "/ai.txt", headers: [noIndexHeader] },
      { source: "/llms.txt", headers: [noIndexHeader] },
    ];
  },
};
export default nextConfig;

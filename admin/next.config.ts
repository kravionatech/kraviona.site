import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Give all admin "view live" links a safe canonical default at build time.
  // A deployment may still explicitly set NEXT_PUBLIC_CLIENT_URL.
  env: {
    NEXT_PUBLIC_CLIENT_URL:
      process.env.NEXT_PUBLIC_CLIENT_URL || "https://kraviona.site",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

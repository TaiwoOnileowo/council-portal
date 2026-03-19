import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "ui-avatars.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "*.ufs.sh" },
      { hostname: "utfs.io" },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [{ hostname: "*.ufs.sh" }, { hostname: "utfs.io" }],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dashboard is fully client-side (seeded demo data + localStorage), so it ships as a
  // static export and is served from Cloudflare as plain assets.
  output: "export",
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

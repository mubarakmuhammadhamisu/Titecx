import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — covers all project URLs e.g. *.supabase.co
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase co.uk and other regional domains
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

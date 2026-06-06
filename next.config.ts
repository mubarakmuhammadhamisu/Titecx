import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.paystack.co https://www.youtube.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.checkout.paystack.com https://*.paystack.com https://paystack.com https://play.gumlet.io https://iframe.mediadelivery.net https://drive.google.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://img.youtube.com https://i.ytimg.com https://*.paystack.com https://paystack.com https://*.gumlet.io https://video.gumlet.io https://*.b-cdn.net",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.paystack.co https://checkout.paystack.com https://*.paystack.com https://paystack.com",
      "style-src 'self' 'unsafe-inline' https://*.paystack.com https://paystack.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

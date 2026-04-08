import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the app from being embedded in an iframe on other origins (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers from MIME-sniffing a response away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin in the Referer header, never the full path
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict access to browser features not used by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Content-Security-Policy — restricts which sources can load scripts, frames, images etc.
  // 'unsafe-inline' is required for script-src (Next.js hydration) and style-src (Tailwind).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.paystack.co https://www.youtube.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.checkout.paystack.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://img.youtube.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.paystack.co https://checkout.paystack.com",
      "style-src 'self' 'unsafe-inline'",
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
        // Apply to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
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

import type { NextConfig } from "next";
import path from "node:path";

// Read at build/server-start time (this file runs in Node, never shipped to
// the browser) so the CSP always matches whichever Supabase project is
// actually configured, without a code change if it ever changes.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Static (non-nonce) CSP, per Next.js's own documented "Without Nonces"
// approach (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// Nonce-based CSP was deliberately NOT used here: it requires forcing every
// page into dynamic rendering (no static generation, no CDN caching), which
// would regress this site's About/FAQ/Policies/Locations/Schedule pages from
// static to server-rendered-per-request for a marginal CSP improvement —
// a bad trade for a marketing + booking site.
//
// style-src needs 'unsafe-inline': Framer Motion (used throughout Hero, the
// navbar, and most section reveals) animates via direct inline `style`
// attribute writes, not stylesheet classes. There's no browser available in
// this environment to verify a stricter policy wouldn't silently break that
// motion sitewide, so this is a documented, deliberate exception rather than
// a blind default. script-src has no such dependency and stays strict.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://images.pexels.com https://ik.imagekit.io https://images.unsplash.com https://upload.wikimedia.org`,
  "font-src 'self'",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

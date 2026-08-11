import type { NextConfig } from "next";
import path from "node:path";

// Read at build/server-start time (this file runs in Node, never shipped to
// the browser) so the CSP always matches whichever Supabase project is
// actually configured, without a code change if it ever changes.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isDev = process.env.NODE_ENV === "development";
const supabaseImagePattern = (() => {
  if (!supabaseUrl) return null;
  try {
    const url = new URL(supabaseUrl);
    return {
      protocol: url.protocol === "http:" ? ("http" as const) : ("https" as const),
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/coach-photos/**",
    };
  } catch {
    return null;
  }
})();

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
// attribute writes, not stylesheet classes.
//
// script-src ALSO needs 'unsafe-inline' — this was a real bug, caught live:
// Next.js's App Router hydrates by streaming RSC payloads through inline
// `<script>self.__next_f.push(...)</script>` tags in the page HTML. Without
// 'unsafe-inline' here, the browser silently blocks those scripts, which
// means React never hydrates at all — every Framer Motion element that
// starts as `opacity:0` in the server HTML (the navbar, the hero heading,
// nearly every section reveal) stays invisible forever, and no client
// interactivity (mobile menu, forms, auth state) works. This is exactly the
// 'unsafe-inline' Next's own "Without Nonces" CSP guide includes on
// script-src by default — matching it now instead of deviating from it.
//
// 'unsafe-eval' is added in development ONLY: React's dev-mode debugging
// (reconstructing server error stacks in the browser, Fast Refresh) relies
// on eval(), which this CSP otherwise blocks — also called out explicitly
// in Next's own CSP docs. Production never uses eval() by default, so it
// stays out of the production policy.
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Supabase Storage host included so admin-uploaded images (coach photos,
  // payment QR codes, receipts) render. CSP is a separate gate from the
  // next/image remotePatterns configuration below.
  `img-src 'self' data: https://images.pexels.com https://ik.imagekit.io https://images.unsplash.com https://upload.wikimedia.org${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
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
    // Preserve a true 2x candidate for full-bleed photography on 1920px
    // displays, including the small overscan used by reveal animations.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 4096],
    // Photography uses 92 (visually near-lossless without the severe weight
    // of blanket quality 100); small brand assets explicitly request 100.
    qualities: [75, 92, 100],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "images.pexels.com" },
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
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

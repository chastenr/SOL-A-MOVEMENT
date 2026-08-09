import type { Metadata } from "next";
import Image from "next/image";
import { sanitizeRedirectTo } from "@/lib/utils";
import { siteConfig } from "@/data/site";
import { SiteLockForm } from "@/components/site-lock/SiteLockForm";

export const metadata: Metadata = {
  title: "Veora Wellness",
  robots: { index: false, follow: false },
};

// Standalone splash — no Navbar/Footer (see the /site-locked exclusion in
// both) so a visitor without the password sees nothing but this. Reached
// by src/lib/supabase/middleware.ts redirecting every other route here
// while SITE_LOCKED is true (see src/lib/site-lock.ts).
export default async function SiteLockedPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const safeRedirectTo = sanitizeRedirectTo(redirectTo, "/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Image src="/veora-mark.png" alt="" width={342} height={360} priority className="h-12 w-auto" />
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-charcoal/45">{siteConfig.name}</p>
      <h1 className="font-display balance mt-5 max-w-md text-2xl text-charcoal sm:text-3xl">
        This site is under construction.
      </h1>
      <p className="mt-3 max-w-sm text-charcoal/60">Enter the password to continue.</p>
      <SiteLockForm redirectTo={safeRedirectTo} />
    </div>
  );
}

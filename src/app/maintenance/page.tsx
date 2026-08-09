import type { Metadata } from "next";
import Image from "next/image";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "We'll Be Right Back",
  robots: { index: false, follow: false },
};

// Standalone splash — no Navbar/Footer (see the /maintenance exclusion in
// both) so this reads as "coming soon," not a half-broken page. Reachable
// directly, and it's also where src/lib/supabase/middleware.ts rewrites
// every non-allowed route to while MAINTENANCE_MODE=true.
export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-6 text-center text-ivory">
      <Image
        src="/veora-mark.png"
        alt=""
        width={342}
        height={360}
        priority
        className="h-12 w-auto opacity-90"
      />
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-ivory/50">{siteConfig.name}</p>
      <h1 className="font-display balance mt-5 max-w-xl text-3xl sm:text-4xl">
        We&rsquo;re putting the finishing touches on something special.
      </h1>
      <p className="mt-4 max-w-md text-ivory/65">
        Veora Wellness will be back shortly. Thank you for your patience.
      </p>
      <a
        href={`mailto:${siteConfig.contact.email}`}
        className="mt-8 text-sm uppercase tracking-[0.15em] text-ivory/70 underline underline-offset-4 hover:text-ivory"
      >
        {siteConfig.contact.email}
      </a>
    </div>
  );
}

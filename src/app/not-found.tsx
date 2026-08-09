import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-clay">404</p>
      <h1 className="font-display balance mt-5 text-3xl text-charcoal sm:text-4xl">
        We couldn&rsquo;t find that page.
      </h1>
      <p className="mt-4 text-charcoal/65">
        The page you&rsquo;re looking for may have moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button href="/">Back to Home</Button>
        <Button href="/contact" variant="secondary">
          Contact Us
        </Button>
      </div>
    </div>
  );
}

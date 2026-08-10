"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Scoped to everything under (protected) — a thrown Server Action or render
 * error here (a stale row someone else just actioned, a dropped connection)
 * only replaces the page content, not this layout's sidebar/header. Without
 * this file the error bubbled past the admin shell entirely to the root
 * global-error.tsx, wiping the whole panel (nav included) for what's usually
 * just "that booking already changed, refresh and try again."
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-ivory p-8 text-center">
      <p className="font-display text-lg text-charcoal">Something didn&rsquo;t go through.</p>
      <p className="mt-2 text-sm text-charcoal/60">
        This is usually just a stale page — someone else may have already actioned this, or the connection
        hiccuped. Try again.
      </p>
      <Button type="button" size="md" onClick={reset} className="mt-5">
        Try Again
      </Button>
    </div>
  );
}

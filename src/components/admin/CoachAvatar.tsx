"use client";

import { useState } from "react";

/**
 * Falls back to an initial-letter circle if the photo URL 404s or the
 * browser otherwise can't load it (e.g. a future CSP/host misconfiguration)
 * — the failure mode this exists for is exactly the CSP img-src gap fixed
 * in next.config.ts: a real, valid image silently blocked by the browser,
 * which without this just showed the raw broken-image icon.
 */
export function CoachAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-lg text-charcoal/40">
      {name.charAt(0)}
    </div>
  );
}

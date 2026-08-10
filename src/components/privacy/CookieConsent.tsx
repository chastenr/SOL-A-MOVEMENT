"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_NAME = "veora_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
export const COOKIE_SETTINGS_EVENT = "veora:open-cookie-settings";

type CookiePreference = "accepted" | "necessary";

function hasSavedPreference(): boolean {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
}

function savePreference(preference: CookiePreference) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${preference}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent("veora:cookie-consent", { detail: preference }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(!hasSavedPreference());
    });

    function openSettings() {
      setVisible(true);
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    };
  }, []);

  function choose(preference: CookiePreference) {
    savePreference(preference);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      data-no-text-reveal
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-heading"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-4 bottom-4 z-[200] mx-auto max-w-3xl rounded-2xl border border-charcoal/10 bg-ivory/95 p-5 shadow-2xl backdrop-blur-md sm:bottom-6 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 id="cookie-consent-heading" className="font-display text-xl text-charcoal">
            Your privacy matters.
          </h2>
          <p id="cookie-consent-description" className="mt-2 text-sm leading-relaxed text-charcoal/65">
            We use essential cookies for secure sign-in, bookings, and site functionality. You can accept
            optional cookies or continue with necessary cookies only. Read our{" "}
            <Link href="/policies#privacy-cookies" className="underline underline-offset-2 hover:text-clay">
              Privacy &amp; Cookie Notice
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-full bg-charcoal px-5 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Accept cookies
          </button>
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded-full border border-charcoal/20 px-5 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Necessary only
          </button>
        </div>
      </div>
    </aside>
  );
}

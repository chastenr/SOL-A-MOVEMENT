"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GOOGLE_ANALYTICS_ID, GOOGLE_TAG_MANAGER_ID } from "@/lib/analytics";

const GTM_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var analyticsGranted = document.cookie.split('; ').some(function(cookie) {
  return cookie === 'veora_cookie_consent=accepted';
});
gtag('consent', 'default', {
  analytics_storage: analyticsGranted ? 'granted' : 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted'
});
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');
`;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleTagManager() {
  useEffect(() => {
    function updateConsent(event: Event) {
      const preference = (event as CustomEvent<"accepted" | "necessary">).detail;
      window.dataLayer = window.dataLayer || [];
      window.gtag?.(
        "consent",
        "update",
        {
          analytics_storage: preference === "accepted" ? "granted" : "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        }
      );
      window.dataLayer.push({ event: "veora_consent_update" });
    }

    window.addEventListener("veora:cookie-consent", updateConsent);
    return () => window.removeEventListener("veora:cookie-consent", updateConsent);
  }, []);

  return (
    <>
      <Script
        id="veora-google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: GTM_BOOTSTRAP }}
      />
      <Script
        id="veora-google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="veora-google-analytics-config" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}');`}
      </Script>
    </>
  );
}

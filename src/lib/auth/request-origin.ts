import "server-only";
import { headers } from "next/headers";

/** Resolve the public origin from the current request instead of relying on
 * a deployment environment variable that may be missing or stale. */
export async function getAuthRedirectOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const requestOrigin = requestHeaders.get("origin");
  if (requestOrigin?.startsWith("http://") || requestOrigin?.startsWith("https://")) {
    return requestOrigin;
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (forwardedHost) {
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (forwardedHost.includes("localhost") ? "http" : "https");
    return `${protocol}://${forwardedHost}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.veorawellnessph.com";
}

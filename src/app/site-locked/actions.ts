"use server";

import { cookies } from "next/headers";
import { getSitePassword, SITE_LOCK_COOKIE } from "@/lib/site-lock";

type ActionResult = { error: string } | { success: true };

export async function unlockSiteAction(password: string): Promise<ActionResult> {
  if (password !== getSitePassword()) {
    return { error: "That password isn't right — try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SITE_LOCK_COOKIE, getSitePassword(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true };
}

"use client";

import { useState } from "react";
import { TotpEnrollFlow } from "@/components/auth/TotpEnrollFlow";
import { PhoneMfaFlow } from "@/components/auth/PhoneMfaFlow";

/**
 * TOTP is the recommended, primary path — it works today with no external
 * dependency. Phone/SMS is offered as a secondary option, but will error
 * with a clear message unless an SMS provider has been configured in the
 * Supabase dashboard (see feature-flags.ts / isAdminMfaRequired()).
 */
export function AdminMfaChooser({ redirectTo }: { redirectTo: string }) {
  const [method, setMethod] = useState<"totp" | "phone">("totp");

  return (
    <div>
      {method === "totp" ? <TotpEnrollFlow redirectTo={redirectTo} /> : <PhoneMfaFlow redirectTo={redirectTo} heading="Verify your identity" />}

      <p className="mt-6 text-center text-sm text-charcoal/45">
        {method === "totp" ? (
          <button
            type="button"
            onClick={() => setMethod("phone")}
            className="underline underline-offset-2 hover:text-charcoal"
          >
            Use SMS instead
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMethod("totp")}
            className="underline underline-offset-2 hover:text-charcoal"
          >
            Use an authenticator app instead
          </button>
        )}
      </p>
    </div>
  );
}

import { NextResponse } from "next/server";
import { format } from "date-fns";
import { contactSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/email";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";
import { isRateLimitedDb } from "@/lib/rate-limit-db";

export async function POST(request: Request) {
  const rateLimitKey = getClientKey(request, "contact");
  // In-memory check first (cheap, catches a burst on one warm instance);
  // DB-backed check second (authoritative across instances — see migration
  // 0007). Anonymous and email-triggering, so this is the one that actually
  // needs the cross-instance guarantee, not just a UX nicety.
  if (isRateLimited(rateLimitKey) || (await isRateLimitedDb(rateLimitKey, 600, 5))) {
    return NextResponse.json(
      { message: "Too many messages sent. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please check your message and try again.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const contact = parsed.data;
  const submittedAt = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

  const emailResult = await sendContactEmail({ ...contact, submittedAt });
  if ("skipped" in emailResult || emailResult.error) {
    return NextResponse.json(
      { message: "Messaging is temporarily unavailable. Please email bookings@veora.ph directly." },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { format } from "date-fns";
import { contactSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/email";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitKey = getClientKey(request, "contact");
  if (isRateLimited(rateLimitKey)) {
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

  await sendContactEmail({ ...contact, submittedAt });

  return NextResponse.json({ success: true });
}

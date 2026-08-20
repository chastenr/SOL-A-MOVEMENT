import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUserApi } from "@/lib/auth/require-role";
import { normalizePhoneE164 } from "@/lib/phone";
import { verifyPhoneOtp } from "@/lib/phone-otp";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().trim().min(1).max(40),
  code: z.string().trim().regex(/^\d{6}$/),
});

const MESSAGE: Record<string, string> = {
  incorrect: "That verification code is incorrect.",
  expired: "This verification code has expired. Please request a new one.",
  not_found: "Please request a new verification code.",
  too_many_attempts: "Too many incorrect attempts. Please request a new code.",
  unavailable: "We couldn't verify your number right now. Please try again later.",
};

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUserApi();
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ message: error.message }, { status: error.status });
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (isRateLimited(getClientKey(request, `phone-otp-verify:${user.id}`), { windowMs: 15 * 60 * 1000, max: 10 })) {
    return NextResponse.json({ message: "Too many attempts. Please request a new code." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  const phone = parsed.success ? normalizePhoneE164(parsed.data.phone) : null;
  if (!parsed.success || !phone) {
    return NextResponse.json({ message: "Enter the 6-digit verification code." }, { status: 400 });
  }

  const result = await verifyPhoneOtp(user.id, phone, parsed.data.code);
  if (result === "verified") return NextResponse.json({ success: true, message: "Mobile number verified." });
  const status = result === "unavailable" ? 503 : result === "too_many_attempts" ? 429 : 400;
  return NextResponse.json({ message: MESSAGE[result] }, { status });
}

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUserApi } from "@/lib/auth/require-role";
import { normalizePhoneE164 } from "@/lib/phone";
import { requestPhoneOtp } from "@/lib/phone-otp";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";
import { isRateLimitedDb } from "@/lib/rate-limit-db";

const schema = z.object({ phone: z.string().trim().min(1).max(40) });

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUserApi();
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ message: error.message }, { status: error.status });
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  const phone = parsed.success ? normalizePhoneE164(parsed.data.phone) : null;
  if (!phone) return NextResponse.json({ message: "Enter a valid Philippine mobile number." }, { status: 400 });

  const phoneKey = createHash("sha256").update(phone).digest("hex");
  const ipKey = getClientKey(request, "phone-otp");
  if (isRateLimited(`${ipKey}:${user.id}`, { windowMs: 60 * 60 * 1000, max: 10 })) {
    return NextResponse.json({ message: "Too many code requests. Please try again later." }, { status: 429 });
  }

  if (await isRateLimitedDb(`phone-otp-cooldown:${user.id}:${phoneKey}`, 60, 1)) {
    return NextResponse.json(
      { message: "Please wait 60 seconds before requesting another code.", retryAfter: 60 },
      { status: 429 }
    );
  }
  if (await isRateLimitedDb(`phone-otp-hour:${user.id}:${phoneKey}`, 3600, 5)) {
    return NextResponse.json({ message: "Too many code requests. Please try again later." }, { status: 429 });
  }

  const result = await requestPhoneOtp(user.id, phone);
  if ("success" in result) {
    return NextResponse.json({ success: true, message: "Verification code sent.", retryAfter: result.retryAfter });
  }
  if (result.error === "cooldown") {
    return NextResponse.json(
      { message: `Please wait ${result.retryAfter ?? 60} seconds before requesting another code.`, retryAfter: result.retryAfter },
      { status: 429 }
    );
  }
  if (result.error === "rate_limited") {
    return NextResponse.json({ message: "Too many code requests. Please try again later." }, { status: 429 });
  }
  return NextResponse.json(
    { message: "We couldn't send a verification code right now. Please try again later." },
    { status: 503 }
  );
}

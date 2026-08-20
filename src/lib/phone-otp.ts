import "server-only";
import { createHmac, randomInt } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSmsConfigured, sendOtp } from "@/lib/sms";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_HOURLY_LIMIT = 5;

function otpHashSecret(): string | null {
  return process.env.SEMAPHORE_API_KEY?.trim() || null;
}

export function hashPhoneOtp(userId: string, phone: string, code: string): string {
  const secret = otpHashSecret();
  if (!secret) throw new Error("Semaphore is not configured.");
  return createHmac("sha256", secret).update(`${userId}:${phone}:${code}`).digest("hex");
}

export type RequestPhoneOtpResult =
  | { success: true; retryAfter: number }
  | { error: "not_configured" | "cooldown" | "rate_limited" | "unavailable"; retryAfter?: number };

export async function requestPhoneOtp(userId: string, phone: string): Promise<RequestPhoneOtpResult> {
  if (!supabaseAdmin || !isSmsConfigured) return { error: "not_configured" };

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const [{ data: latest }, { count: phoneCount }, { count: userCount }] = await Promise.all([
    supabaseAdmin
      .from("phone_verifications")
      .select("created_at")
      .eq("user_id", userId)
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("phone_verifications")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", hourAgo),
    supabaseAdmin
      .from("phone_verifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", hourAgo),
  ]);

  if ((phoneCount ?? 0) >= OTP_HOURLY_LIMIT || (userCount ?? 0) >= OTP_HOURLY_LIMIT) {
    return { error: "rate_limited", retryAfter: 3600 };
  }

  if (latest?.created_at) {
    const elapsed = now - new Date(latest.created_at).getTime();
    if (elapsed < OTP_COOLDOWN_MS) {
      return { error: "cooldown", retryAfter: Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000) };
    }
  }

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(now + OTP_TTL_MS).toISOString();
  const { data: verification, error: insertError } = await supabaseAdmin
    .from("phone_verifications")
    .insert({ user_id: userId, phone, code_hash: hashPhoneOtp(userId, phone, code), expires_at: expiresAt })
    .select("id")
    .single();
  if (insertError || !verification) return { error: "unavailable" };

  try {
    await sendOtp(phone, code);
    return { success: true, retryAfter: 60 };
  } catch (error) {
    await supabaseAdmin.from("phone_verifications").delete().eq("id", verification.id);
    console.error("[phone-otp] Semaphore delivery failed", {
      userId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown Semaphore error",
    });
    return { error: "unavailable" };
  }
}

export type VerifyPhoneOtpResult = "verified" | "not_found" | "expired" | "too_many_attempts" | "incorrect" | "unavailable";

export async function verifyPhoneOtp(userId: string, phone: string, code: string): Promise<VerifyPhoneOtpResult> {
  if (!supabaseAdmin || !otpHashSecret()) return "unavailable";
  const { data, error } = await supabaseAdmin.rpc("verify_semaphore_phone_otp", {
    p_user_id: userId,
    p_phone: phone,
    p_code_hash: hashPhoneOtp(userId, phone, code),
  });
  if (error) {
    console.error("[phone-otp] verification RPC failed", { userId, error: error.message });
    return "unavailable";
  }
  return (data as VerifyPhoneOtpResult | null) ?? "unavailable";
}

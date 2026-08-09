import { NextResponse } from "next/server";
import { requireUserApi, AuthError } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { isUuid } from "@/lib/utils";

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  P0000: { status: 401, message: "Please sign in." },
  P0007: { status: 404, message: "That booking could not be found or is no longer cancellable." },
  P0008: { status: 409, message: "This class has already started and can no longer be cancelled." },
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUserApi();
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }

  const { id: bookingId } = await params;
  if (!isUuid(bookingId)) {
    return NextResponse.json(
      { message: "That booking could not be found or is no longer cancellable." },
      { status: 404 }
    );
  }

  const rateLimitKey = `booking-cancel:${user.id}`;
  if (isRateLimited(rateLimitKey, { windowMs: 60 * 1000, max: 10 })) {
    return NextResponse.json({ message: "Please slow down and try again in a moment." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_class_booking", { p_booking_id: bookingId });

  if (error) {
    const mapped = ERROR_MAP[error.code ?? ""] ?? { status: 500, message: "Something went wrong. Please try again." };
    return NextResponse.json({ message: mapped.message }, { status: mapped.status });
  }

  return NextResponse.json({ success: true });
}

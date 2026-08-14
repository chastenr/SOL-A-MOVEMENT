import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";

const DAYS_AHEAD = 14;

/**
 * Runs once daily (see vercel.json) and keeps a rolling 14-day window of
 * real class_sessions generated from the "Class Times" recurring template
 * (migration 0015) — an admin sets up each open hour once (which class
 * type, which coach), and this is what turns that template into actual
 * bookable sessions going forward, instead of someone hand-creating a
 * session for every configured weekday and time. The database function also
 * completes sessions whose end time has passed before generating new ones.
 *
 * Same auth convention as /api/cron/check-attendance: Vercel's CRON_SECRET
 * bearer token, service-role Supabase client (the underlying function is
 * also directly callable by an admin session — see
 * generateRecurringSessionsAction — this route is just the unattended path).
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { message: "SUPABASE_SERVICE_ROLE_KEY isn't configured — this job can't run yet." },
      { status: 500 }
    );
  }

  const { data, error } = await supabaseAdmin.rpc("generate_recurring_class_sessions", {
    p_days_ahead: DAYS_AHEAD,
  });

  if (error) {
    return NextResponse.json({ message: "Failed to generate sessions." }, { status: 500 });
  }

  return NextResponse.json({ created: data });
}

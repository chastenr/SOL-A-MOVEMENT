import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";

/** Creates each monthly due row once, alerts admins, and moves unpaid
 * memberships to Past Due after the due date. Historical bookings remain. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ message: "Membership due processing is not configured." }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin.rpc("process_membership_dues");
  if (error) {
    console.error("[/api/cron/membership-dues] processing failed", error);
    return NextResponse.json({ message: "Failed to process membership dues." }, { status: 500 });
  }
  return NextResponse.json({ created: data });
}

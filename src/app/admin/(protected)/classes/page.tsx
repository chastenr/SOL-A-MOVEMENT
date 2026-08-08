import type { Metadata } from "next";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { cancelClassSessionAction } from "./actions";

export const metadata: Metadata = {
  title: "Classes",
  robots: { index: false, follow: false },
};

type SessionRow = {
  id: string;
  start_at: string;
  end_at: string;
  capacity: number;
  booked_count: number;
  status: "scheduled" | "cancelled" | "completed";
  class_type: { name: string } | null;
  location: { name: string } | null;
  instructor: { name: string } | null;
};

export default async function AdminClassesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id, start_at, end_at, capacity, booked_count, status, class_type:class_types(name), location:locations(name), instructor:instructors(name)"
    )
    .order("start_at", { ascending: true })
    .limit(100);

  const sessions = (data as unknown as SessionRow[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Classes</h1>
        <Button href="/admin/classes/new">Schedule Session</Button>
      </div>
      <p className="mt-1 text-sm text-charcoal/55">
        Real, bookable class sessions — customers redeem package credits against these on{" "}
        <code>/account/book</code>.
      </p>

      {sessions.length === 0 ? (
        <p className="mt-8 text-charcoal/60">
          No class sessions scheduled yet. Schedule one above to make it bookable.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
              <tr>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 text-charcoal">{session.class_type?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/70">{session.location?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/70">{session.instructor?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/70">{format(new Date(session.start_at), "MMM d, yyyy · h:mm a")}</td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {session.booked_count} / {session.capacity}
                  </td>
                  <td className="px-4 py-3 text-charcoal/70 capitalize">{session.status}</td>
                  <td className="px-4 py-3 text-right">
                    {session.status === "scheduled" && (
                      <form action={cancelClassSessionAction.bind(null, session.id)}>
                        <button type="submit" className="text-xs underline underline-offset-2 hover:text-charcoal">
                          Cancel
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

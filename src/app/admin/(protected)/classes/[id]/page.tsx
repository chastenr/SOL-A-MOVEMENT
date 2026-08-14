import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { differenceInMinutes } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { utcToManilaLocal } from "@/lib/studio-hours";
import { ClassSessionForm } from "@/components/admin/ClassSessionForm";
import { getClassSessionRoster } from "@/lib/admin/bookings";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { completeBookingAction, noShowBookingAction } from "../../bookings/actions";
import type { ClassSessionFormValues } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Edit Session",
  robots: { index: false, follow: false },
};

const ROSTER_STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  completed: "Attended",
  no_show: "No Show",
  cancelled: "Cancelled",
};

const ROSTER_STATUS_STYLE: Record<string, string> = {
  booked: "bg-charcoal/10 text-charcoal/60",
  completed: "bg-emerald-50 text-emerald-700",
  no_show: "bg-red-50 text-red-600",
  cancelled: "bg-charcoal/10 text-charcoal/40",
};

export default async function EditClassSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: session }, { data: classTypes }, { data: locations }, { data: instructors }, { data: timeSlots }, roster] =
    await Promise.all([
      supabase
        .from("class_sessions")
        .select("class_type_id, location_id, instructor_id, start_at, end_at, capacity, minimum_participants, booked_count, status")
        .eq("id", id)
        .single(),
      supabase.from("class_types").select("id, name, service_slug").eq("active", true).order("name"),
      supabase.from("locations").select("id, name").eq("active", true).order("name"),
      supabase.from("instructors").select("id, name").eq("active", true).order("name"),
      supabase.from("class_time_slots").select("location_id, weekday, hour, is_active"),
      getClassSessionRoster(id),
    ]);

  if (!session) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Edit Session</h1>

      {session.status !== "scheduled" ? (
        <p className="mt-4 text-charcoal/60">This session is {session.status} and can no longer be edited.</p>
      ) : (
        <div className="mt-6">
          <ClassSessionForm
            classTypes={(classTypes ?? []).map((classType) => ({
              id: classType.id,
              name: classType.name,
              serviceSlug: classType.service_slug,
            }))}
            locations={locations ?? []}
            instructors={instructors ?? []}
            timeSlots={(timeSlots ?? []).map((slot) => ({
              locationId: slot.location_id,
              weekday: slot.weekday,
              hour: slot.hour,
              isActive: slot.is_active,
            }))}
            editing={{ id, bookedCount: session.booked_count, initialValues: toFormValues(session) }}
          />
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg text-charcoal">Attendance</h2>
        <p className="mt-1 text-sm text-charcoal/55">
          Who&rsquo;s booked into this specific class — check them in as Attended or No Show once it&rsquo;s
          run. This is recorded separately for every scheduled date and time.
        </p>

        {roster.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/60">No one is booked into this session yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-charcoal/10 text-xs uppercase tracking-[0.08em] text-charcoal/45">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {roster.map((booking) => (
                  <tr key={booking.id} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-charcoal">{booking.customerName}</p>
                      <p className="text-xs text-charcoal/45">{booking.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">{booking.packageName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${ROSTER_STATUS_STYLE[booking.status]}`}
                      >
                        {ROSTER_STATUS_LABEL[booking.status] ?? booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {booking.status === "booked" && (
                        <div className="flex justify-end gap-3">
                          <form action={completeBookingAction.bind(null, booking.id)}>
                            <SubmitButton pendingLabel="…" className="text-xs underline underline-offset-2 hover:text-charcoal">
                              Mark Attended
                            </SubmitButton>
                          </form>
                          <form action={noShowBookingAction.bind(null, booking.id)}>
                            <SubmitButton
                              pendingLabel="…"
                              className="text-xs text-charcoal/50 underline underline-offset-2 hover:text-red-600"
                            >
                              Mark No Show
                            </SubmitButton>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function toFormValues(session: {
  class_type_id: string;
  location_id: string;
  instructor_id: string | null;
  start_at: string;
  end_at: string;
  capacity: number;
  minimum_participants: number | null;
}): ClassSessionFormValues {
  return {
    classTypeId: session.class_type_id,
    locationId: session.location_id,
    instructorId: session.instructor_id ?? "",
    startAt: utcToManilaLocal(session.start_at),
    durationMinutes: differenceInMinutes(new Date(session.end_at), new Date(session.start_at)),
    capacity: session.capacity,
    minimumParticipants: session.minimum_participants ?? "",
  };
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { differenceInMinutes } from "date-fns";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { utcToManilaLocal } from "@/lib/studio-hours";
import { ClassSessionForm } from "@/components/admin/ClassSessionForm";
import type { ClassSessionFormValues } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Edit Session",
  robots: { index: false, follow: false },
};

export default async function EditClassSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: session }, { data: classTypes }, { data: locations }, { data: instructors }, { data: timeSlots }] =
    await Promise.all([
      supabase
        .from("class_sessions")
        .select("class_type_id, location_id, instructor_id, start_at, end_at, capacity, minimum_participants, booked_count, status")
        .eq("id", id)
        .single(),
      supabase.from("class_types").select("id, name, service_slug").eq("active", true).order("name"),
      supabase.from("locations").select("id, name").eq("active", true).order("name"),
      supabase.from("instructors").select("id, name").eq("active", true).order("name"),
      supabase.from("class_time_slots").select("location_id, hour, is_active"),
    ]);

  if (!session) notFound();

  if (session.status !== "scheduled") {
    return (
      <div>
        <h1 className="font-display text-2xl text-charcoal">Edit Session</h1>
        <p className="mt-4 text-charcoal/60">
          This session is {session.status} and can no longer be edited.
        </p>
      </div>
    );
  }

  const initialValues: ClassSessionFormValues = {
    classTypeId: session.class_type_id,
    locationId: session.location_id,
    instructorId: session.instructor_id ?? "",
    startAt: utcToManilaLocal(session.start_at),
    durationMinutes: differenceInMinutes(new Date(session.end_at), new Date(session.start_at)),
    capacity: session.capacity,
    minimumParticipants: session.minimum_participants ?? "",
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Edit Session</h1>
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
            hour: slot.hour,
            isActive: slot.is_active,
          }))}
          editing={{ id, bookedCount: session.booked_count, initialValues }}
        />
      </div>
    </div>
  );
}

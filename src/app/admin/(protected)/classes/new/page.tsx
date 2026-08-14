import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClassSessionForm } from "@/components/admin/ClassSessionForm";

export const metadata: Metadata = {
  title: "Schedule Session",
  robots: { index: false, follow: false },
};

export default async function NewClassSessionPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: classTypes }, { data: locations }, { data: instructors }, { data: timeSlots }] =
    await Promise.all([
      supabase.from("class_types").select("id, name, service_slug").eq("active", true).order("name"),
      supabase.from("locations").select("id, name").eq("active", true).order("name"),
      supabase.from("instructors").select("id, name").eq("active", true).order("name"),
      supabase.from("class_time_slots").select("location_id, weekday, hour, is_active"),
    ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Schedule Session</h1>
      <div className="mt-4 rounded-xl border border-charcoal/10 bg-ivory px-4 py-3 text-sm text-charcoal/60">
        <p className="font-medium text-charcoal">Add one class on a specific date.</p>
        <p className="mt-1">
          Use this page for a special or one-off session. To build the regular weekly timetable, return to{" "}
          <Link href="/admin/classes" className="font-medium text-charcoal underline underline-offset-2">
            Classes → Class Times
          </Link>
          .
        </p>
      </div>
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
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
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
      supabase.from("class_time_slots").select("location_id, hour, is_active"),
    ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Schedule Session</h1>
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
        />
      </div>
    </div>
  );
}

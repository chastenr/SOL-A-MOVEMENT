import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatHourLabel } from "@/lib/studio-hours";
import { setClassTimeSlotActiveAction } from "./actions";

export const metadata: Metadata = {
  title: "Class Times",
  robots: { index: false, follow: false },
};

type SlotRow = {
  id: string;
  hour: number;
  is_active: boolean;
  location: { name: string } | null;
};

export default async function AdminClassTimeSlotsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("class_time_slots")
    .select("id, hour, is_active, location:locations(name)")
    .order("hour");

  const slots = ((data as unknown as SlotRow[] | null) ?? []).slice();
  const slotsByLocation = new Map<string, SlotRow[]>();
  for (const slot of slots) {
    const locationName = slot.location?.name ?? "—";
    slotsByLocation.set(locationName, [...(slotsByLocation.get(locationName) ?? []), slot]);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Class Times</h1>
      <p className="mt-1 text-sm text-charcoal/55">
        Hourly start times available when scheduling Mat Pilates, Yoga, Barre, and Strength &amp; HIIT
        classes — each one is fixed at 50 minutes, so the next class can start on the hour. Turn a time off
        here and it won&rsquo;t be offered on the <code>Schedule Session</code> form. Ballet isn&rsquo;t
        affected — those classes are 60/90 minutes and keep their own start time.
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&rsquo;t load class times. Has the database migration been run yet? ({error.message})
        </p>
      )}

      {!error && slotsByLocation.size === 0 && (
        <p className="mt-8 text-charcoal/60">No locations found to schedule class times for yet.</p>
      )}

      {[...slotsByLocation.entries()].map(([locationName, locationSlots]) => (
        <div key={locationName} className="mt-6 overflow-x-auto rounded-xl border border-charcoal/10 bg-ivory">
          <div className="border-b border-charcoal/10 px-4 py-3">
            <p className="text-sm font-medium text-charcoal">{locationName}</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-charcoal/5 sm:grid-cols-3 lg:grid-cols-4">
            {locationSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 bg-ivory px-4 py-3">
                <span className="text-sm text-charcoal">{formatHourLabel(slot.hour)}</span>
                <form action={setClassTimeSlotActiveAction.bind(null, slot.id, !slot.is_active)}>
                  <button
                    type="submit"
                    className={
                      slot.is_active
                        ? "rounded-full bg-clay/10 px-2.5 py-1 text-xs text-clay underline-offset-2 hover:underline"
                        : "rounded-full bg-charcoal/10 px-2.5 py-1 text-xs text-charcoal/50 underline-offset-2 hover:underline"
                    }
                  >
                    {slot.is_active ? "Open" : "Closed"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

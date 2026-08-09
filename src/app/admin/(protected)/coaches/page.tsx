import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { deleteCoachAction } from "./actions";

export const metadata: Metadata = {
  title: "Coaches",
  robots: { index: false, follow: false },
};

type InstructorRow = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  active: boolean;
};

export default async function AdminCoachesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("instructors")
    .select("id, name, bio, photo_url, active")
    .order("name");
  const coaches = (data as InstructorRow[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-charcoal">Coaches</h1>
        <Button href="/admin/coaches/new">Add Coach</Button>
      </div>
      <p className="mt-1 text-sm text-charcoal/55">
        Real coach profiles — active coaches appear in the dropdown on <code>/admin/classes/new</code>{" "}
        when scheduling a session, and their name shows to customers on the schedule and booking pages.
      </p>

      {coaches.length === 0 ? (
        <p className="mt-8 text-charcoal/60">No coaches yet. Add one above.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <div key={coach.id} className="flex gap-4 rounded-2xl border border-charcoal/10 bg-ivory p-5">
              {coach.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coach.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-lg text-charcoal/40">
                  {coach.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/coaches/${coach.id}`} className="font-medium text-charcoal hover:underline">
                    {coach.name}
                  </Link>
                  {!coach.active && (
                    <span className="rounded-full bg-charcoal/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-charcoal/50">
                      Inactive
                    </span>
                  )}
                </div>
                {coach.bio && <p className="mt-1 line-clamp-2 text-xs text-charcoal/55">{coach.bio}</p>}
                <div className="mt-3 flex gap-3 text-xs">
                  <Link href={`/admin/coaches/${coach.id}`} className="underline underline-offset-2 hover:text-charcoal">
                    Edit
                  </Link>
                  <form action={deleteCoachAction.bind(null, coach.id)}>
                    <button type="submit" className="text-red-600 underline underline-offset-2 hover:text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

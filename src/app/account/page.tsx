import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, mobile_number")
    .eq("id", user.id)
    .single();

  const firstName = profile?.first_name || "there";

  return (
    <section className="mx-auto max-w-4xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="My Account" heading={`Welcome, ${firstName}.`} />
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            Log Out
          </Button>
        </form>
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Active Package</p>
          <p className="mt-3 text-charcoal/70">You don&rsquo;t have an active package yet.</p>
          <Button href="/pricing" variant="secondary" size="md" className="mt-4">
            View Packages
          </Button>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Upcoming Booking</p>
          <p className="mt-3 text-charcoal/70">No upcoming classes.</p>
          <Button href="/schedule" variant="secondary" size="md" className="mt-4">
            Book a Class
          </Button>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15} className="mt-10 rounded-2xl border border-charcoal/10 bg-cream/40 p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-charcoal/45">Profile</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-charcoal/55">Name</dt>
            <dd className="text-charcoal">
              {profile?.first_name} {profile?.last_name}
            </dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-charcoal/55">Email</dt>
            <dd className="text-charcoal">{profile?.email}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-charcoal/55">Mobile Number</dt>
            <dd className="text-charcoal">{profile?.mobile_number || "—"}</dd>
          </div>
        </dl>
      </AnimatedSection>
    </section>
  );
}

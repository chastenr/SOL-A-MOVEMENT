import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function AccountProfilePage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, mobile_number, birthday")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <SectionHeading eyebrow="Profile" heading="Your details." />
      <p className="mt-2 max-w-lg text-sm text-charcoal/55">Email: {profile?.email}</p>
      <div className="mt-8">
        <ProfileForm
          defaultValues={{
            firstName: profile?.first_name ?? "",
            lastName: profile?.last_name ?? "",
            mobileNumber: profile?.mobile_number ?? "",
            birthday: profile?.birthday ?? "",
          }}
        />
      </div>
    </div>
  );
}

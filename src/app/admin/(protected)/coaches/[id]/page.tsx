import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CoachForm } from "@/components/admin/CoachForm";

export const metadata: Metadata = {
  title: "Edit Coach",
  robots: { index: false, follow: false },
};

export default async function EditCoachPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("instructors")
    .select("id, name, bio, photo_url, active")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-charcoal">Edit Coach</h1>
      <div className="mt-6">
        <CoachForm
          coach={{ id: data.id, name: data.name, bio: data.bio, photoUrl: data.photo_url, active: data.active }}
        />
      </div>
    </div>
  );
}

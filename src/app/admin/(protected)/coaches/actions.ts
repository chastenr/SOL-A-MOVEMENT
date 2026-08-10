"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isHeic, convertHeicToJpeg } from "@/lib/heic";

type ActionResult = { error: string } | { success: true };

// Vercel serverless functions cap request bodies well under 4.5MB — stay
// comfortably below that rather than an arbitrary "8MB is fine" guess (same
// limit as the payment-receipt upload).
const MAX_BYTES = 4 * 1024 * 1024;

function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  // WebP: "RIFF" .... "WEBP" — the format tag sits at byte offset 8.
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Handles both create and update — presence of a non-empty "id" field
 * decides which. Never trusts the client-supplied file Content-Type, only
 * the file's own magic bytes (same convention as the payment-receipt
 * upload route). requireAdmin() here + the coach_photos_write_admin
 * storage policy + instructors_write_admin RLS policy are three
 * independent layers, not one.
 */
export async function upsertCoachAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id");
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const active = formData.get("active") === "true";
  const photo = formData.get("photo");

  if (!name) return { error: "Name is required." };

  const supabase = await createSupabaseServerClient();
  let photoUrl: string | undefined;

  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_BYTES) return { error: "Photo is too large. Please upload a file under 4MB." };
    let bytes = new Uint8Array(await photo.arrayBuffer());
    let mimeType = sniffImageType(bytes);

    if (!mimeType && isHeic(bytes)) {
      try {
        bytes = await convertHeicToJpeg(bytes);
        mimeType = "image/jpeg";
      } catch {
        return { error: "That photo couldn't be converted. Please try a different one, or export it as a JPEG first." };
      }
    }

    if (!mimeType) return { error: "Please upload a JPEG, PNG or WebP image." };

    const path = `${crypto.randomUUID()}.${EXTENSION[mimeType]}`;
    const { error: uploadError } = await supabase.storage
      .from("coach-photos")
      .upload(path, bytes, { contentType: mimeType });
    if (uploadError) return { error: "Something went wrong uploading the photo. Please try again." };

    photoUrl = supabase.storage.from("coach-photos").getPublicUrl(path).data.publicUrl;
  }

  const row: Record<string, unknown> = { name, bio: bio || null, active };
  if (photoUrl) row.photo_url = photoUrl;

  const { error } =
    typeof id === "string" && id
      ? await supabase.from("instructors").update(row).eq("id", id)
      : await supabase.from("instructors").insert(row);

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/coaches");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/classes/new");
  revalidatePath("/schedule");
  revalidatePath("/account/book");
  return { success: true };
}

// Used as a plain `<form action={...}>` handler — see setServiceActiveAction
// for why this throws instead of returning a result.
export async function deleteCoachAction(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // class_sessions.instructor_id is ON DELETE SET NULL (migration 0001), so
  // deleting a coach never orphans or blocks an existing scheduled session —
  // it just becomes "Unassigned."
  const { error } = await supabase.from("instructors").delete().eq("id", id);
  if (error) throw new Error("Something went wrong. Please try again.");

  revalidatePath("/admin/coaches");
  revalidatePath("/admin/classes");
}

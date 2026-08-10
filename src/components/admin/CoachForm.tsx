"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertCoachAction } from "@/app/admin/(protected)/coaches/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

type Coach = {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  active: boolean;
};

export function CoachForm({ coach }: { coach?: Coach }) {
  const router = useRouter();
  const [name, setName] = useState(coach?.name ?? "");
  const [bio, setBio] = useState(coach?.bio ?? "");
  const [active, setActive] = useState(coach?.active ?? true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(coach?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPreviewError(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      if (coach) formData.set("id", coach.id);
      formData.set("name", name.trim());
      formData.set("bio", bio.trim());
      formData.set("active", String(active));
      if (photoFile) formData.set("photo", photoFile);

      const result = await upsertCoachAction(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/admin/coaches?${coach ? "updated" : "added"}=1`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:max-w-lg">
      <Field label="Name" required>
        <input value={name} onChange={(event) => setName(event.target.value)} className={fieldInputClasses} />
      </Field>

      <Field label="Bio (optional)">
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          className={fieldInputClasses}
        />
      </Field>

      <Field label="Photo (optional)">
        <div className="flex items-center gap-4">
          {photoPreview && !previewError && (
            // Admin-uploaded, runtime URL — same reasoning as payment_settings.qr_image_url
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
              onError={() => setPreviewError(true)}
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handlePhotoChange}
            className="text-sm text-charcoal/70 file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.1em] file:text-charcoal hover:file:bg-sand"
          />
        </div>
        {previewError ? (
          <p className="mt-1 text-xs text-charcoal/50">
            No preview available for this photo (common for iPhone photos saved as HEIC) — that&rsquo;s fine,
            it&rsquo;ll still be converted and saved when you submit.
          </p>
        ) : (
          <p className="mt-1 text-xs text-charcoal/40">JPEG, PNG, WebP or an iPhone photo (HEIC), up to 4MB.</p>
        )}
      </Field>

      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Active — shown in the coach dropdown when scheduling classes
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : coach ? "Save Changes" : "Add Coach"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/coaches")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

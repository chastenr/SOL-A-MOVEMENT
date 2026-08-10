"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAction } from "@/app/admin/(protected)/users/actions";
import { Button } from "@/components/ui/Button";
import { fieldInputClasses } from "@/components/ui/Field";

export function DeleteUserButton({
  userId,
  name,
  email,
  disabled,
}: {
  userId: string;
  name: string;
  email: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await deleteUserAction(userId, password);
      setConfirming(false);
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setConfirming(false);
    setPassword("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className="text-xs text-red-600/70 underline underline-offset-2 hover:text-red-600 disabled:opacity-40 disabled:no-underline"
      >
        Remove
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-heading"
        >
          <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-ivory p-6 shadow-xl">
            <h2 id="confirm-delete-heading" className="font-display text-lg text-charcoal">
              Delete this account?
            </h2>
            <p className="mt-2 text-sm text-charcoal/70">
              <strong>{name || email}</strong> ({email}) will be permanently deleted. This can&rsquo;t be
              undone. Accounts with real purchase or booking history can&rsquo;t be deleted this way — set
              them to Customer instead. Enter your own password to confirm.
            </p>
            <div className="mt-4">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className={fieldInputClasses}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-3">
              <Button
                type="submit"
                size="md"
                disabled={submitting || !password}
                className="flex-1 border-red-300 bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Deleting…" : "Delete Account"}
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteStaffSchema, type InviteStaffFormValues } from "@/lib/validations";
import { inviteStaffAction } from "@/app/admin/(protected)/users/actions";
import { ROLE_LABEL } from "@/lib/admin/role-labels";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

export function InviteStaffForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteStaffFormValues>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { email: "", role: "admin" },
  });

  async function onSubmit(values: InviteStaffFormValues) {
    setSubmitting(true);
    setError(null);
    setSent(false);
    try {
      const result = await inviteStaffAction(values);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSent(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
      <Field label="Staff Email" required error={errors.email?.message} className="w-64">
        <input type="email" {...register("email")} className={fieldInputClasses} autoComplete="off" />
      </Field>
      <Field label="Role" className="w-40">
        <select {...register("role")} className={`${fieldInputClasses} appearance-none`}>
          <option value="admin">{ROLE_LABEL.admin}</option>
          <option value="super_admin">{ROLE_LABEL.super_admin}</option>
        </select>
      </Field>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Send Invite"}
      </Button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {sent && <p className="w-full text-sm text-clay">Invite sent — they&rsquo;ll get an email to set their password.</p>}
    </form>
  );
}

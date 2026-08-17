import { z } from "zod";
import { isWithinStudioHours, STUDIO_OPEN_HOUR, STUDIO_CLOSE_HOUR } from "@/lib/studio-hours";

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(20, "Enter a valid phone number.")
    .regex(/^[0-9()+\-.\s]*$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  topic: z.string().trim().min(1, "Please select a topic."),
  message: z.string().trim().min(1, "Please enter a message.").max(2000, "Message must be 2000 characters or fewer."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must include at least one letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
    mobileNumber: z
      .string()
      .trim()
      .min(7, "Enter a valid mobile number.")
      .max(20, "Enter a valid mobile number.")
      .regex(/^[0-9()+\-.\s]+$/, "Enter a valid mobile number."),
    birthday: z.string().trim().optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
    consent: z.boolean().refine((value) => value === true, {
      message: "Please accept the waiver, studio policies, terms, and conditions to continue.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const changeEmailSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
});

export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Distinct from resetPasswordSchema (used by the "forgot password" email-link
// flow, which has no old password to check) — this is for a signed-in user
// changing their password from their own account settings, which must prove
// they still know the current one first.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

const SERVICE_SLUGS = ["mat-pilates", "yoga", "barre", "strength-hiit", "recovery-restore", "ballet"] as const;

export const packageFormSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, "Name is required.").max(160),
  category: z.enum(["classic", "restore", "ballet", "studio_rental"]),
  packageGroup: z.enum([
    "intro_offer",
    "single_session",
    "package",
    "membership",
    "private_session",
    "special_offer",
  ]),
  serviceSlug: z.enum(SERVICE_SLUGS).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be 0 or more."),
  originalPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  creditCount: z.coerce.number().int().min(1).optional().or(z.literal("")),
  validityDescription: z.string().trim().min(1, "Validity description is required.").max(200),
  validityDays: z.coerce.number().int().min(1).optional().or(z.literal("")),
  expiresFrom: z.enum(["purchase", "first_booking"]),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  includedServices: z.string().trim().max(2000).optional().or(z.literal("")),
  conditions: z.string().trim().max(2000).optional().or(z.literal("")),
  isRecommended: z.boolean(),
  recommendedLabel: z.string().trim().max(60).optional().or(z.literal("")),
  isFounderOffer: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int(),
  entitlementType: z.enum(["credits", "unlimited"]),
  membershipDurationMonths: z.coerce.number().int().min(1).max(120).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.isActive && data.price <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["price"], message: "Add the final price before activating this product." });
  }
  if (data.entitlementType === "unlimited") {
    if (data.packageGroup !== "membership") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["packageGroup"], message: "Unlimited entitlements must use the membership group." });
    }
    if (!data.membershipDurationMonths) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["membershipDurationMonths"], message: "Membership duration is required." });
    }
    if (data.creditCount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["creditCount"], message: "Unlimited memberships do not use class credits." });
    }
  }
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

export const serviceFormSchema = z.object({
  slug: z.enum(SERVICE_SLUGS),
  name: z.string().trim().min(1, "Name is required.").max(120),
  category: z.string().trim().min(1, "Category is required.").max(80),
  shortDescription: z.string().trim().min(1, "Short description is required.").max(300),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  duration: z.string().trim().min(1, "Duration is required.").max(80),
  level: z.string().trim().min(1, "Level is required.").max(80),
  instructor: z.string().trim().max(120).optional().or(z.literal("")),
  startingPrice: z.string().trim().max(120).optional().or(z.literal("")),
  classVariants: z.string().trim().max(2000).optional().or(z.literal("")),
  imageSrc: z.string().trim().min(1, "Image URL is required.").url("Enter a valid URL."),
  imageAlt: z.string().trim().min(1, "Image alt text is required.").max(300),
  imageCredit: z.string().trim().max(200).optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const bookClassSchema = z
  .object({
    classSessionId: z.string().uuid("Invalid class session."),
    customerPackageId: z.string().uuid("Invalid package.").optional(),
    customerMembershipId: z.string().uuid("Invalid membership.").optional(),
  })
  .refine((value) => Boolean(value.customerPackageId) !== Boolean(value.customerMembershipId), {
    message: "Select exactly one active package or membership.",
  });

export type BookClassValues = z.infer<typeof bookClassSchema>;

export const classSessionFormSchema = z
  .object({
    classTypeId: z.string().uuid("Please select a class."),
    locationId: z.string().uuid("Please select a location."),
    instructorId: z.string().uuid("Invalid instructor.").optional().or(z.literal("")),
    startAt: z.string().min(1, "Start time is required."),
    durationMinutes: z.coerce.number().int().min(15).max(240),
    capacity: z.coerce.number().int().min(1).max(100),
    // Optional — no minimum enforced (studio decides per session whether one applies).
    minimumParticipants: z.coerce.number().int().min(1).max(100).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.startAt && !isWithinStudioHours(data.startAt, data.durationMinutes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Classes must start and end within studio hours (${STUDIO_OPEN_HOUR}:00 AM–${STUDIO_CLOSE_HOUR - 12}:00 PM).`,
        path: ["startAt"],
      });
    }
  });

export type ClassSessionFormValues = z.infer<typeof classSessionFormSchema>;

export const inviteStaffSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  role: z.enum(["admin", "super_admin"]),
});

export type InviteStaffFormValues = z.infer<typeof inviteStaffSchema>;

export const paymentSettingFormSchema = z.object({
  method: z.enum(["bank_transfer", "gcash_qr", "paymongo_card", "cash", "other"]),
  label: z.string().trim().min(1, "Label is required.").max(80),
  bankName: z.string().trim().max(120).optional().or(z.literal("")),
  accountName: z.string().trim().max(120).optional().or(z.literal("")),
  accountNumber: z.string().trim().max(60).optional().or(z.literal("")),
  qrImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export type PaymentSettingFormValues = z.infer<typeof paymentSettingFormSchema>;

export const grantPackageSchema = z.object({
  userId: z.string().uuid("Please select a customer."),
  packageId: z.string().uuid("Please select a package."),
  reason: z.string().trim().max(300).optional().or(z.literal("")),
});

export type GrantPackageValues = z.infer<typeof grantPackageSchema>;

export const adjustCreditsSchema = z.object({
  customerPackageId: z.string().uuid(),
  newBalance: z.coerce.number().int().min(0, "Credits cannot be below zero."),
  reason: z.string().trim().min(1, "A reason is required.").max(300),
});

export type AdjustCreditsValues = z.infer<typeof adjustCreditsSchema>;

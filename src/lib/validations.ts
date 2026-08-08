import { z } from "zod";

export const bookingSchema = z.object({
  service: z.string().min(1, "Please select a service."),
  date: z.string().min(1, "Please select a date."),
  time: z.string().min(1, "Please select a time."),
  /** Optional pricing/package option name carried through from /pricing — informational only, no payment is processed. */
  packageName: z.string().trim().max(120).optional().or(z.literal("")),
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Enter a valid phone number.")
    .regex(/^[0-9()+\-.\s]+$/, "Enter a valid phone number."),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer.").optional().or(z.literal("")),
  consent: z.boolean().refine((value) => value === true, {
    message: "Please confirm you agree to be contacted regarding your booking.",
  }),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

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
      message: "Please agree to the Terms and Privacy Policy to continue.",
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

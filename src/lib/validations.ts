import { z } from "zod";

export const bookingSchema = z.object({
  service: z.string().min(1, "Please select a service."),
  date: z.string().min(1, "Please select a date."),
  time: z.string().min(1, "Please select a time."),
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

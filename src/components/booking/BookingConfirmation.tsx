"use client";

import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { getServiceBySlug } from "@/data/services";
import type { BookingFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/Button";

export function BookingConfirmation({
  booking,
  onBookAnother,
}: {
  booking: BookingFormValues;
  onBookAnother: () => void;
}) {
  const service = getServiceBySlug(booking.service);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal text-ivory"
      >
        <Check size={28} />
      </motion.div>

      <h2 className="font-display mt-8 text-3xl text-charcoal sm:text-4xl">
        Your booking has been received.
      </h2>
      <p className="mt-4 max-w-md text-charcoal/65">
        Thanks, {booking.firstName}. We&rsquo;ve sent your booking details to your email.
      </p>

      <dl className="mt-10 w-full max-w-sm divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 text-left">
        <Row label="Service" value={service?.name ?? booking.service} />
        <Row label="Date" value={format(parseISO(booking.date), "EEEE, MMMM d, yyyy")} />
        <Row label="Time" value={booking.time} />
      </dl>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button href="/" variant="secondary" size="lg">
          Back to Home
        </Button>
        <Button type="button" size="lg" onClick={onBookAnother}>
          Book Another Session
        </Button>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between px-5 py-4">
      <dt className="text-xs uppercase tracking-[0.12em] text-charcoal/45">{label}</dt>
      <dd className="text-sm text-charcoal">{value}</dd>
    </div>
  );
}

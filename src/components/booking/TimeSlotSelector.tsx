"use client";

import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

type TimeSlotSelectorProps = {
  date: string;
  selectedTime?: string;
  onSelectTime: (time: string) => void;
};

export function TimeSlotSelector({ date, selectedTime, onSelectTime }: TimeSlotSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-sm font-medium text-charcoal">
        Available times for {format(parseISO(date), "EEEE, MMMM d")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {siteConfig.timeSlots.map((time) => {
          const isSelected = time === selectedTime;
          return (
            <button
              key={time}
              type="button"
              onClick={() => onSelectTime(time)}
              aria-pressed={isSelected}
              className={cn(
                "rounded-full border px-4 py-3 text-sm transition-colors duration-200",
                isSelected
                  ? "border-charcoal bg-charcoal text-ivory"
                  : "border-charcoal/15 text-charcoal hover:border-charcoal/40"
              )}
            >
              {time}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

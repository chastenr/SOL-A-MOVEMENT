"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_MONTHS_AHEAD = 3;

type BookingCalendarProps = {
  selectedDate?: string;
  onSelectDate: (date: string) => void;
};

export function BookingCalendar({ selectedDate, onSelectDate }: BookingCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(today));

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(visibleMonth));
    const gridEnd = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const canGoBack = isBefore(today, visibleMonth);
  const maxMonth = startOfMonth(addMonths(today, MAX_MONTHS_AHEAD));
  const canGoForward = isBefore(visibleMonth, maxMonth);

  function isDisabled(day: Date) {
    if (isBefore(day, today)) return true;
    if (siteConfig.closedWeekdays.includes(day.getDay())) return true;
    return false;
  }

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-ivory p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-charcoal/40 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-lg text-charcoal">{format(visibleMonth, "MMMM yyyy")}</p>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoForward}
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-charcoal/40 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-[0.08em] text-charcoal/40">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={format(visibleMonth, "yyyy-MM")}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day) => {
            const inMonth = isSameMonth(day, visibleMonth);
            const disabled = isDisabled(day);
            const isSelected = selectedDate ? isSameDay(day, new Date(`${selectedDate}T00:00:00`)) : false;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => onSelectDate(format(day, "yyyy-MM-dd"))}
                aria-pressed={isSelected}
                aria-label={format(day, "EEEE, MMMM d, yyyy")}
                className={cn(
                  "aspect-square rounded-full text-sm transition-colors duration-200",
                  !inMonth && "text-charcoal/20",
                  inMonth && !disabled && !isSelected && "text-charcoal hover:bg-cream",
                  disabled && "text-charcoal/20 line-through",
                  isSelected && "bg-charcoal text-ivory",
                  isToday && !isSelected && "font-semibold text-clay"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

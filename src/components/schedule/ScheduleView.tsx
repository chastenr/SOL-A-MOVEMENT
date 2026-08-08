"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScheduleCard, type ScheduleCardData } from "@/components/schedule/ScheduleCard";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Pilates", "Yoga", "Wellness", "Private"] as const;

export function ScheduleView({ sessions }: { sessions: ScheduleCardData[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");

  const filteredSessions = useMemo(() => {
    if (activeFilter === "All") return sessions;
    return sessions.filter((session) => session.service.category === activeFilter);
  }, [sessions, activeFilter]);

  return (
    <div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {FILTERS.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2 text-sm uppercase tracking-[0.1em] transition-colors duration-300",
                isActive
                  ? "border-charcoal bg-charcoal text-ivory"
                  : "border-charcoal/20 text-charcoal/60 hover:border-charcoal/50 hover:text-charcoal"
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {filteredSessions.length === 0 ? (
        <p className="mt-16 text-center text-charcoal/60">
          No sessions in this category right now — check back soon or explore another category.
        </p>
      ) : (
        <motion.div
          layout
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredSessions.map((session) => (
            <motion.div key={session.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ScheduleCard session={session} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScheduleCard } from "@/components/schedule/ScheduleCard";
import type { ClassDirectoryEntry } from "@/data/schedule";
import { cn } from "@/lib/utils";

export function ScheduleView({ entries }: { entries: ClassDirectoryEntry[] }) {
  const filters = useMemo(() => {
    const categories = Array.from(new Set(entries.map((entry) => entry.category)));
    return ["All", ...categories];
  }, [entries]);

  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredEntries = useMemo(() => {
    if (activeFilter === "All") return entries;
    return entries.filter((entry) => entry.category === activeFilter);
  }, [entries, activeFilter]);

  return (
    <div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {filters.map((filter) => {
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

      {filteredEntries.length === 0 ? (
        <p className="mt-16 text-center text-charcoal/60">
          No classes in this category right now — check back soon or explore another category.
        </p>
      ) : (
        <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <motion.div key={entry.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ScheduleCard entry={entry} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScheduleCard } from "@/components/schedule/ScheduleCard";
import type { ClassDirectoryEntry } from "@/data/schedule";
import { cn } from "@/lib/utils";

const CLASS_FAMILIES = ["All", "Veora Classics", "Veora Restore", "Veora Ballet"] as const;
type ClassFamily = (typeof CLASS_FAMILIES)[number];

function getFamily(entry: ClassDirectoryEntry): ClassFamily {
  if (entry.serviceSlug === "recovery-restore") return "Veora Restore";
  if (entry.serviceSlug === "ballet") return "Veora Ballet";
  return "Veora Classics";
}

function getFormat(entry: ClassDirectoryEntry): string {
  if (entry.id.startsWith("heated-")) return "Heated";
  if (entry.id.startsWith("red-light-")) return "Red Light";
  if (entry.serviceSlug === "ballet") return "Ballet";
  return "Classic";
}

function getBaseClassName(entry: ClassDirectoryEntry): string {
  return entry.name
    .replace(/^Heated /, "")
    .replace(/^Red Light \+ /, "")
    .replace(/ \([^)]*\)$/, "");
}

export function ScheduleView({ entries }: { entries: ClassDirectoryEntry[] }) {
  const filterOptions = useMemo(() => {
    const classTypes = Array.from(new Set(entries.map(getBaseClassName))).sort();
    const formats = Array.from(new Set(entries.map(getFormat)));
    const levels = Array.from(new Set(entries.map((entry) => entry.level)));
    return { classTypes, formats, levels };
  }, [entries]);

  const [activeFamily, setActiveFamily] = useState<ClassFamily>("All");
  const [classType, setClassType] = useState("All");
  const [format, setFormat] = useState("All");
  const [level, setLevel] = useState("All");

  const filteredEntries = useMemo(() => {
    return entries.filter(
      (entry) =>
        (activeFamily === "All" || getFamily(entry) === activeFamily) &&
        (classType === "All" || getBaseClassName(entry) === classType) &&
        (format === "All" || getFormat(entry) === format) &&
        (level === "All" || entry.level === level)
    );
  }, [entries, activeFamily, classType, format, level]);

  const hasActiveDropdown = classType !== "All" || format !== "All" || level !== "All";

  function clearFilters() {
    setActiveFamily("All");
    setClassType("All");
    setFormat("All");
    setLevel("All");
  }

  return (
    <div>
      <div className="border-b border-charcoal/15">
        <div className="no-scrollbar flex gap-7 overflow-x-auto" role="group" aria-label="Filter by class family">
          {CLASS_FAMILIES.map((family) => {
            const isActive = family === activeFamily;
            return (
              <button
                key={family}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFamily(family)}
                className={cn(
                  "relative shrink-0 px-1 pb-4 text-sm uppercase tracking-[0.1em] transition-colors duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-walnut after:transition-transform",
                  isActive
                    ? "text-charcoal after:scale-x-100"
                    : "text-charcoal/50 after:scale-x-0 hover:text-charcoal"
                )}
              >
                {family}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal/10 bg-ivory p-3 shadow-sm shadow-charcoal/5">
        <div className="grid gap-2 md:grid-cols-3">
          <label className="sr-only" htmlFor="class-type-filter">
            Class type
          </label>
          <select
            id="class-type-filter"
            value={classType}
            onChange={(event) => setClassType(event.target.value)}
            className="min-h-12 rounded-xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/15"
          >
            <option value="All">All class types</option>
            {filterOptions.classTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="class-format-filter">
            Class format
          </label>
          <select
            id="class-format-filter"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="min-h-12 rounded-xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/15"
          >
            <option value="All">All class formats</option>
            {filterOptions.formats.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="class-level-filter">
            Difficulty level
          </label>
          <select
            id="class-level-filter"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="min-h-12 rounded-xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/15"
          >
            <option value="All">All difficulty levels</option>
            {filterOptions.levels.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 px-1 pt-3 text-xs text-charcoal/50">
          <p aria-live="polite">
            Showing {filteredEntries.length} of {entries.length} classes
          </p>
          {(activeFamily !== "All" || hasActiveDropdown) && (
            <button type="button" onClick={clearFilters} className="underline underline-offset-4 hover:text-charcoal">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="mt-16 text-center text-charcoal/60">
          No classes in this category right now — check back soon or explore another category.
        </p>
      ) : (
        <motion.div layout className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

import { addDays, parse, startOfWeek } from "date-fns";
import { getServiceBySlug, type ServiceCategory } from "@/data/services";

export type ScheduleTemplate = {
  id: string;
  serviceSlug: string;
  instructor: string;
  /** 0 = Sunday ... 6 = Saturday */
  dayOfWeek: number;
  time: string;
  duration: string;
  spots: number;
};

// Recurring weekly session templates. Edit freely — dates are generated
// relative to the current week, so this list never goes stale.
export const scheduleTemplates: ScheduleTemplate[] = [
  { id: "mon-reformer-9", serviceSlug: "reformer-pilates", instructor: "TODO — Instructor name", dayOfWeek: 1, time: "9:00 AM", duration: "50 min", spots: 8 },
  { id: "mon-yoga-1030", serviceSlug: "yoga-flow", instructor: "TODO — Instructor name", dayOfWeek: 1, time: "10:30 AM", duration: "55 min", spots: 10 },
  { id: "mon-mobility-530", serviceSlug: "mobility-stretch", instructor: "TODO — Instructor name", dayOfWeek: 1, time: "5:30 PM", duration: "45 min", spots: 8 },
  { id: "tue-mat-9", serviceSlug: "mat-pilates", instructor: "TODO — Instructor name", dayOfWeek: 2, time: "9:00 AM", duration: "45 min", spots: 10 },
  { id: "tue-private-11", serviceSlug: "private-sessions", instructor: "TODO — Instructor name", dayOfWeek: 2, time: "11:00 AM", duration: "50 min", spots: 1 },
  { id: "tue-reformer-430", serviceSlug: "reformer-pilates", instructor: "TODO — Instructor name", dayOfWeek: 2, time: "4:30 PM", duration: "50 min", spots: 8 },
  { id: "wed-yoga-9", serviceSlug: "yoga-flow", instructor: "TODO — Instructor name", dayOfWeek: 3, time: "9:00 AM", duration: "55 min", spots: 10 },
  { id: "wed-wellness-1230", serviceSlug: "wellness-sessions", instructor: "TODO — Instructor name", dayOfWeek: 3, time: "12:30 PM", duration: "45 min", spots: 6 },
  { id: "wed-reformer-6", serviceSlug: "reformer-pilates", instructor: "TODO — Instructor name", dayOfWeek: 3, time: "6:00 PM", duration: "50 min", spots: 8 },
  { id: "thu-mat-930", serviceSlug: "mat-pilates", instructor: "TODO — Instructor name", dayOfWeek: 4, time: "9:30 AM", duration: "45 min", spots: 10 },
  { id: "thu-mobility-1", serviceSlug: "mobility-stretch", instructor: "TODO — Instructor name", dayOfWeek: 4, time: "1:00 PM", duration: "45 min", spots: 8 },
  { id: "thu-private-5", serviceSlug: "private-sessions", instructor: "TODO — Instructor name", dayOfWeek: 4, time: "5:00 PM", duration: "50 min", spots: 1 },
  { id: "fri-reformer-9", serviceSlug: "reformer-pilates", instructor: "TODO — Instructor name", dayOfWeek: 5, time: "9:00 AM", duration: "50 min", spots: 8 },
  { id: "fri-yoga-1030", serviceSlug: "yoga-flow", instructor: "TODO — Instructor name", dayOfWeek: 5, time: "10:30 AM", duration: "55 min", spots: 10 },
  { id: "sat-mat-9", serviceSlug: "mat-pilates", instructor: "TODO — Instructor name", dayOfWeek: 6, time: "9:00 AM", duration: "45 min", spots: 12 },
  { id: "sat-wellness-1030", serviceSlug: "wellness-sessions", instructor: "TODO — Instructor name", dayOfWeek: 6, time: "10:30 AM", duration: "45 min", spots: 6 },
];

export type ScheduleSession = {
  id: string;
  date: Date;
  time: string;
  duration: string;
  instructor: string;
  spots: number;
  service: {
    slug: string;
    name: string;
    category: ServiceCategory;
  };
};

/** Expands the recurring templates into dated sessions for the week containing `reference`. */
export function getWeekSchedule(reference: Date, weeksAhead = 0): ScheduleSession[] {
  const weekStart = addDays(startOfWeek(reference, { weekStartsOn: 1 }), weeksAhead * 7);

  return scheduleTemplates
    .map((template) => {
      const service = getServiceBySlug(template.serviceSlug);
      if (!service) return null;

      const date = addDays(weekStart, template.dayOfWeek === 0 ? 6 : template.dayOfWeek - 1);

      return {
        id: `${template.id}-${date.toISOString().slice(0, 10)}`,
        date,
        time: template.time,
        duration: template.duration,
        instructor: template.instructor,
        spots: template.spots,
        service: {
          slug: service.slug,
          name: service.name,
          category: service.category,
        },
      } satisfies ScheduleSession;
    })
    .filter((session): session is ScheduleSession => session !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Combines a session's calendar date with its "9:00 AM"-style time string. */
export function combineDateAndTime(date: Date, time: string): Date {
  return parse(time, "h:mm a", date);
}

export function isSessionUpcoming(session: Pick<ScheduleSession, "date" | "time">, reference: Date): boolean {
  return combineDateAndTime(session.date, session.time).getTime() >= reference.getTime();
}

import type { ServiceCategory } from "@/data/services";

export type ClassDirectoryEntry = {
  id: string;
  name: string;
  category: ServiceCategory;
  /** Slug of the umbrella service this class books under in the /book flow. */
  serviceSlug: string;
  duration: string;
  level: string;
  description: string;
};

// Veora does not yet have a published weekly class timetable (no specific
// dates, times or instructors have been confirmed). Rather than invent a
// fake recurring schedule, this is the real class directory — every class
// type currently offered — so clients can browse and request a booking.
// Update this list once a live timetable and instructor roster exist.
export const classDirectory: ClassDirectoryEntry[] = [
  {
    id: "mat-pilates",
    name: "Mat Pilates",
    category: "Mat Pilates",
    serviceSlug: "mat-pilates",
    duration: "50 min",
    level: "Open to all",
    description:
      "Strengthen your core, improve balance and enhance flexibility with confidence and precision.",
  },
  {
    id: "hatha",
    name: "Hatha",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Improve flexibility, balance and relaxation with traditional yoga poses and mindful breathing.",
  },
  {
    id: "vinyasa-yoga",
    name: "Vinyasa Yoga",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Improve strength, flexibility and mindfulness with breath-led movement that flows between poses.",
  },
  {
    id: "power-yoga",
    name: "Power Yoga",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Build strength, stamina and confidence through energetic, full-body yoga.",
  },
  {
    id: "ashtanga",
    name: "Ashtanga",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Build strength, endurance and discipline through a dynamic, structured sequence of postures.",
  },
  {
    id: "restorative-yoga",
    name: "Restorative Yoga",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Reduce stress, improve flexibility and promote deep relaxation through gentle, supported poses.",
  },
  {
    id: "gentle-flow-yoga",
    name: "Gentle Flow Yoga",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Improve mobility, balance and relaxation through slow, mindful movement suitable for all levels.",
  },
  {
    id: "stretch-yoga",
    name: "Stretch Yoga",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Improve flexibility, mobility and recovery with guided stretches that reduce muscle tension.",
  },
  {
    id: "yogalates",
    name: "Yogalates",
    category: "Yoga",
    serviceSlug: "yoga",
    duration: "50 min",
    level: "Open to all",
    description: "Improve strength, flexibility and core stability by combining yoga and Pilates.",
  },
  {
    id: "barre",
    name: "Barre",
    category: "Barre",
    serviceSlug: "barre",
    duration: "50 min",
    level: "Open to all",
    description: "Improve posture, balance and muscle endurance through low-impact, ballet-inspired movement.",
  },
  {
    id: "mat-strength",
    name: "Mat Strength",
    category: "Strength & HIIT",
    serviceSlug: "strength-hiit",
    duration: "50 min",
    level: "Open to all",
    description: "Develop functional strength, stability and balance with guided full-body resistance exercises.",
  },
  {
    id: "mat-sculpt",
    name: "Mat Sculpt",
    category: "Strength & HIIT",
    serviceSlug: "strength-hiit",
    duration: "50 min",
    level: "Open to all",
    description: "Build lean muscle, improve endurance and tone your body through targeted, strength-focused movement.",
  },
  {
    id: "functional-group-exercise",
    name: "Functional Group Exercise",
    category: "Strength & HIIT",
    serviceSlug: "strength-hiit",
    duration: "50 min",
    level: "Open to all",
    description: "Improve strength, mobility and overall fitness in a supportive group setting.",
  },
  {
    id: "hiit",
    name: "HIIT",
    category: "Strength & HIIT",
    serviceSlug: "strength-hiit",
    duration: "50 min",
    level: "Open to all",
    description: "Improve cardiovascular fitness, build strength and burn calories through high-intensity intervals.",
  },
  {
    id: "little-swans-ballet",
    name: "Little Swans Ballet (3–5 yrs)",
    category: "Ballet",
    serviceSlug: "ballet",
    duration: "60 min",
    level: "Beginner",
    description: "Play-based ballet that introduces coordination, balance, rhythm and imaginative storytelling.",
  },
  {
    id: "tiny-stars-ballet",
    name: "Tiny Stars Ballet (6–8 yrs)",
    category: "Ballet",
    serviceSlug: "ballet",
    duration: "60 min",
    level: "Beginner",
    description: "The basic foundations of classical ballet — posture, balance, coordination and flexibility.",
  },
  {
    id: "rising-stars-ballet",
    name: "Rising Stars Ballet (9–12 yrs)",
    category: "Ballet",
    serviceSlug: "ballet",
    duration: "90 min",
    level: "Beginner to Intermediate",
    description: "Classical technique and alignment, with proper turns, jumps and movement quality.",
  },
  {
    id: "prima-ballet",
    name: "Prima Ballet (13–17 yrs)",
    category: "Ballet",
    serviceSlug: "ballet",
    duration: "90 min",
    level: "Beginner to Intermediate",
    description: "Refined technique, artistry and performance skills, with a focus on alignment and injury prevention.",
  },
  {
    id: "adult-ballet",
    name: "Adult Ballet (18+)",
    category: "Ballet",
    serviceSlug: "ballet",
    duration: "60 min",
    level: "Beginner",
    description: "Ballet fundamentals in a welcoming, supportive environment — perfect for complete beginners.",
  },
];

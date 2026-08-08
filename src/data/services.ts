import { images } from "@/data/images";

export type ServiceCategory = "Mat Pilates" | "Yoga" | "Barre" | "Strength & HIIT" | "Recovery & Restore" | "Ballet";

export type Service = {
  slug: string;
  name: string;
  category: ServiceCategory;
  shortDescription: string;
  description: string;
  duration: string;
  level: string;
  instructor?: string;
  /** Real, informational pricing published by the studio — no online payment is collected. */
  startingPrice?: string;
  classVariants?: string[];
  image: { src: string; alt: string; credit?: string };
};

export const services: Service[] = [
  {
    slug: "mat-pilates",
    name: "Mat Pilates",
    category: "Mat Pilates",
    shortDescription:
      "Strengthen your core, improve balance and enhance flexibility on the mat.",
    description:
      "Move with intention in our Mat Pilates classes, where you'll strengthen your core, improve balance and enhance flexibility. Every session is led by experienced instructors and designed to help you build strength with confidence, precision and personalized guidance.",
    duration: "50 min",
    level: "Open to all",
    startingPrice: "₱850 for a single class",
    image: images.services["mat-pilates"],
  },
  {
    slug: "yoga",
    name: "Yoga",
    category: "Yoga",
    shortDescription:
      "Breath-led movement, from energizing flows to gentle, restorative practice.",
    description:
      "From energizing Vinyasa and Power Yoga to gentle Hatha, Restorative, Gentle Flow, Stretch Yoga and Yogalates, our yoga classes build flexibility, balance and mindful breath at whatever pace suits you.",
    duration: "50 min",
    level: "Open to all",
    startingPrice: "₱850 for a single class",
    classVariants: [
      "Hatha",
      "Vinyasa Yoga",
      "Power Yoga",
      "Ashtanga",
      "Restorative Yoga",
      "Gentle Flow Yoga",
      "Stretch Yoga",
      "Yogalates",
    ],
    image: images.services.yoga,
  },
  {
    slug: "barre",
    name: "Barre",
    category: "Barre",
    shortDescription: "Low-impact, ballet-inspired movement for posture and endurance.",
    description:
      "Improve posture, balance and muscle endurance through low-impact movements inspired by ballet — a full-body sculpting class suited to every level.",
    duration: "50 min",
    level: "Open to all",
    startingPrice: "₱850 for a single class",
    image: images.services.barre,
  },
  {
    slug: "strength-hiit",
    name: "Strength & HIIT",
    category: "Strength & HIIT",
    shortDescription: "Functional strength, sculpt and cardio conditioning classes.",
    description:
      "Build functional strength, tone and cardiovascular fitness through Mat Strength, Mat Sculpt, Functional Group Exercise and HIIT — guided, full-body sessions for every fitness level.",
    duration: "50 min",
    level: "Open to all",
    startingPrice: "₱850 for a single class",
    classVariants: ["Mat Strength", "Mat Sculpt", "Functional Group Exercise", "HIIT"],
    image: images.services["strength-hiit"],
  },
  {
    slug: "recovery-restore",
    name: "Recovery & Restore",
    category: "Recovery & Restore",
    shortDescription: "Infrared-heated and red light therapy recovery classes.",
    description:
      "Our Restore classes bring the heat. Choose from infrared-heated versions of our signature Pilates, yoga, barre and strength classes, or red light therapy sessions designed to support circulation, recovery and deep relaxation.",
    duration: "50 min",
    level: "Open to all",
    startingPrice: "₱1,500 for a single class",
    image: images.services["recovery-restore"],
  },
  {
    slug: "ballet",
    name: "Ballet",
    category: "Ballet",
    shortDescription: "Classical ballet training for every age, from 3 through adult.",
    description:
      "Structured ballet training for every age — from playful, play-based first steps at 3–5 years old through disciplined technique for teens and adults — building posture, coordination, artistry and confidence.",
    duration: "60–90 min, varies by age group",
    level: "Beginner-friendly, all ages",
    startingPrice: "₱1,000 trial class",
    classVariants: [
      "Little Swans Ballet (3–5 yrs)",
      "Tiny Stars Ballet (6–8 yrs)",
      "Rising Stars Ballet (9–12 yrs)",
      "Prima Ballet (13–17 yrs)",
      "Adult Ballet (18+)",
    ],
    image: images.services.ballet,
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

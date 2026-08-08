import { images } from "@/data/images";

export type ServiceCategory = "Pilates" | "Yoga" | "Wellness" | "Private";

export type Service = {
  slug: string;
  name: string;
  category: ServiceCategory;
  shortDescription: string;
  description: string;
  duration: string;
  level: string;
  instructor?: string;
  image: { src: string; alt: string; credit?: string };
};

export const services: Service[] = [
  {
    slug: "reformer-pilates",
    name: "Reformer Pilates",
    category: "Pilates",
    shortDescription:
      "Build strength, control and stability through intentional reformer movement.",
    description:
      "Using the resistance and support of the reformer, this session builds long, lean strength while improving alignment, control and body awareness. Each class is guided to meet you where you are, whether you're new to the reformer or refining an established practice.",
    duration: "50 min",
    level: "All levels",
    instructor: "TODO — Instructor name",
    image: images.services["reformer-pilates"],
  },
  {
    slug: "mat-pilates",
    name: "Mat Pilates",
    category: "Pilates",
    shortDescription:
      "Foundational Pilates focused on core strength, mobility and alignment.",
    description:
      "A grounded, floor-based practice that builds core strength from the inside out. Mat Pilates emphasizes breath, control and precision, creating a foundation of strength and mobility that carries into everyday movement.",
    duration: "45 min",
    level: "Beginner friendly",
    instructor: "TODO — Instructor name",
    image: images.services["mat-pilates"],
  },
  {
    slug: "yoga-flow",
    name: "Yoga Flow",
    category: "Yoga",
    shortDescription:
      "Breath-led movement designed to improve flexibility, balance and body awareness.",
    description:
      "A dynamic, breath-led sequence that moves through strength, balance and flexibility. Yoga Flow is designed to quiet the mind while building an intuitive, embodied sense of movement.",
    duration: "55 min",
    level: "All levels",
    instructor: "TODO — Instructor name",
    image: images.services["yoga-flow"],
  },
  {
    slug: "mobility-stretch",
    name: "Mobility & Stretch",
    category: "Wellness",
    shortDescription:
      "Intentional sessions designed to improve movement, release tension and restore mobility.",
    description:
      "A slower, deeply intentional session focused on releasing tension, restoring range of motion and improving how your body moves and feels. A restorative complement to a strength-focused practice.",
    duration: "45 min",
    level: "All levels",
    instructor: "TODO — Instructor name",
    image: images.services["mobility-stretch"],
  },
  {
    slug: "private-sessions",
    name: "Private Sessions",
    category: "Private",
    shortDescription: "Personalized one-on-one movement designed around your goals.",
    description:
      "A fully personalized session designed around your body, your goals and your pace. Private sessions offer individualized attention and a program that evolves with you over time.",
    duration: "50 min",
    level: "Personalized",
    instructor: "TODO — Instructor name",
    image: images.services["private-sessions"],
  },
  {
    slug: "wellness-sessions",
    name: "Wellness Sessions",
    category: "Wellness",
    shortDescription:
      "An editable placeholder for any additional wellness services SOLÉA offers.",
    description:
      "TODO — Placeholder for additional wellness offerings such as recovery, breathwork or bodywork sessions. Update this description once SOLÉA finalizes the details of this offering.",
    duration: "TODO",
    level: "All levels",
    instructor: undefined,
    image: images.services["wellness-sessions"],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

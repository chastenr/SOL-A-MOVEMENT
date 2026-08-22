import { images, type StudioImage } from "@/data/images";

export type ArticleSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type WellnessArticle = {
  slug: string;
  title: string;
  eyebrow: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  image: StudioImage;
  introduction: string[];
  sections: ArticleSection[];
};

export const articles: WellnessArticle[] = [
  {
    slug: "pilates-yoga-or-barre",
    title: "Pilates, Yoga or Barre: Which Class Is Right for You?",
    eyebrow: "Beginner’s guide",
    excerpt:
      "A clear, pressure-free guide to choosing between Mat Pilates, yoga and barre based on how you want to move, feel and grow.",
    publishedAt: "2026-08-22",
    readTime: "6 min read",
    image: images.services.yoga,
    introduction: [
      "Choosing your first movement class should not feel like choosing the one perfect workout. Mat Pilates, yoga and barre can all build strength, awareness and confidence—the difference is where each practice places its attention.",
      "The best starting point is the class that matches what you want from this season of your life. You may want controlled strength, more space to breathe, or an energizing full-body challenge. This guide will help you recognize which experience sounds most like you.",
    ],
    sections: [
      {
        id: "mat-pilates",
        title: "Choose Mat Pilates for controlled strength and precision",
        paragraphs: [
          "Mat Pilates uses intentional, controlled movement to strengthen the core and support the way your whole body moves. Classes often ask you to slow down, notice alignment and make smaller movements with greater awareness.",
          "It can be a satisfying choice when you enjoy learning technique and want a practice that feels focused rather than rushed. You do not need previous Pilates experience to begin; learning the foundations is part of the class.",
        ],
        bullets: [
          "You want to build deep core strength and stability",
          "You enjoy precise, thoughtfully paced movement",
          "You want to improve balance, posture and body awareness",
        ],
      },
      {
        id: "yoga",
        title: "Choose yoga for breath-led movement and mobility",
        paragraphs: [
          "Yoga connects movement with breath. Depending on the format, a class may feel flowing and energizing or gentle and restorative. Veora’s yoga offering includes options such as Hatha, Vinyasa, Power Yoga, Restorative Yoga, Gentle Flow, Stretch Yoga and Yogalates.",
          "Yoga is a flexible place to begin because you can choose a pace that suits your energy. The practice invites you to work with your body as it is today instead of forcing a particular shape or performance.",
        ],
        bullets: [
          "You want to improve flexibility and everyday mobility",
          "You enjoy connecting movement with mindful breathing",
          "You want a choice between energetic and slower-paced formats",
        ],
      },
      {
        id: "barre",
        title: "Choose barre for low-impact endurance and energy",
        paragraphs: [
          "Barre combines ballet-inspired positions with accessible, low-impact strength work. Expect precise repetitions, posture-focused movement and a steady full-body challenge—without needing any dance background.",
          "The class can feel upbeat and social while still asking for concentration. It is a strong match if you like structured sequences and the satisfying feeling of working your muscles through controlled repetition.",
        ],
        bullets: [
          "You want a low-impact, full-body challenge",
          "You enjoy rhythmic movement and structured sequences",
          "You want to build posture, balance and muscular endurance",
        ],
      },
      {
        id: "how-to-choose",
        title: "Use the feeling you want as your deciding factor",
        paragraphs: [
          "If several options appeal to you, think less about labels and more about the experience you want when class ends. For focused strength and control, begin with Mat Pilates. For breath, mobility or a calmer reset, choose a yoga format that matches your preferred pace. For an energetic, posture-focused burn, try barre.",
          "Your choice does not need to be permanent. Many people enjoy rotating practices: Pilates for control, yoga for mobility and barre for endurance. A varied routine can also keep movement interesting and help you notice what your body responds to on different days.",
        ],
      },
      {
        id: "first-class",
        title: "What to know before your first class",
        paragraphs: [
          "All three practices are beginner-friendly when taught with clear guidance. Arrive a little early, tell your instructor that it is your first class and ask questions whenever a movement feels unfamiliar. Choose comfortable clothing that lets you move freely and follow the studio’s guidance on what to bring.",
          "Most importantly, give yourself permission to learn. Your first session is not a test. It is simply a chance to experience the room, meet the movement and notice how you feel afterward.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

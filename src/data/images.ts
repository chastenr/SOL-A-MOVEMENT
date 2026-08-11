export type StudioImage = {
  src: string;
  alt: string;
  credit?: string;
};

function imagekit(id: string) {
  // Keep the real studio original intact. Its 1478×831 source contains
  // enough detail for the site's capped layout at roughly 2× density;
  // asking ImageKit for a fake 3840px derivative only increases bytes.
  return `https://ik.imagekit.io/rezeve/business/e29c8d72-9f97-4d16-85e7-a044591c66a9/image/editor/${id}.jpg`;
}

// Pexels photos, chosen for indoor studio settings matching each specific
// class type (never a reformer — Veora's Mat Pilates is mat-based, no
// reformer machines on site) and, where the photo's own description
// confirms it, Asian representation. Selection is based on each photo's
// published title/description/photographer metadata, not literal visual
// inspection — the same method used for the original photo set.
function pexels(id: string) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
}

export const images = {
  hero: {
    src: pexels("23095854"),
    alt: "A group yoga class practicing floor poses together in a bright indoor studio",
  },
  introduction: {
    src: pexels("3900798"),
    alt: "Two women stretching together on mats in an indoor studio",
  },
  // Real photo of the studio's class floor — mats, props and arched alcoves.
  studioExperienceOne: {
    src: imagekit("38a6d1e6-7df6-432b-97e9-40edf218eeee"),
    alt: "The studio's class floor, lined with rolled mats beneath arched, softly lit alcoves",
  },
  studioExperienceTwo: {
    src: pexels("5150459"),
    alt: "A dancer poses gracefully at the barre in a bright, sunlit studio",
  },
  bookingCta: {
    src: pexels("5150474"),
    alt: "An instructor guides a student through a stretch at the barre in a daylit studio",
  },
  services: {
    "mat-pilates": {
      src: pexels("9288130"),
      alt: "Women using Pilates arcs on mats during an indoor class",
    },
    yoga: {
      src: pexels("23095852"),
      alt: "A group of women practicing yoga poses together on mats in an indoor studio",
    },
    barre: {
      src: pexels("5150457"),
      alt: "A woman leaning on the barre during an indoor barre class",
    },
    "strength-hiit": {
      src: pexels("3768696"),
      alt: "A woman training with dumbbells alongside others in a bright indoor studio",
    },
    "recovery-restore": {
      src: pexels("4534595"),
      alt: "A woman resting in child's pose on a mat during a restorative indoor session",
    },
    ballet: {
      src: pexels("5150509"),
      alt: "A dancer stretching at the barre during an indoor ballet rehearsal",
    },
  },
} satisfies {
  hero: StudioImage;
  introduction: StudioImage;
  studioExperienceOne: StudioImage;
  studioExperienceTwo: StudioImage;
  bookingCta: StudioImage;
  services: Record<string, StudioImage>;
};

export type StudioImage = {
  src: string;
  alt: string;
  credit?: string;
};

function unsplash(id: string, w = 2000) {
  return `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
}

// Wikimedia's /thumb/ endpoint only serves a restricted allow-list of widths
// and 400s on anything else, so we fetch the full original file instead and
// let next/image handle resizing.
function commons(path: string, file: string) {
  return `https://upload.wikimedia.org/wikipedia/commons/${path}/${file}`;
}

function imagekit(id: string, w = 1800) {
  return `https://ik.imagekit.io/rezeve/business/e29c8d72-9f97-4d16-85e7-a044591c66a9/image/editor/${id}.jpg?tr=w-${w}`;
}

export const images = {
  hero: {
    src: unsplash("1506126613408-eca07ce68773", 2400),
    alt: "A woman in a seated meditation pose, silhouetted against warm golden sunrise light",
  },
  introduction: {
    src: unsplash("1544367567-0f2fcb009e0b", 2000),
    alt: "A woman in a flowing yoga pose silhouetted against an ocean sunset",
  },
  // Real photo of the studio's class floor — mats, props and arched alcoves.
  studioExperienceOne: {
    src: imagekit("38a6d1e6-7df6-432b-97e9-40edf218eeee", 1800),
    alt: "The studio's class floor, lined with rolled mats beneath arched, softly lit alcoves",
  },
  studioExperienceTwo: {
    src: unsplash("1600334129128-685c5582fd35", 1800),
    alt: "Hands performing a warm hot-stone treatment beside white orchids",
  },
  bookingCta: {
    src: unsplash("1599901860904-17e6ed7083a0", 2200),
    alt: "A woman holding a downward-facing dog pose on a studio floor",
  },
  services: {
    "mat-pilates": {
      src: unsplash("1552196563-55cd4e45efb3", 1800),
      alt: "A woman seated cross-legged on a mat in a calm, minimal studio",
    },
    yoga: {
      src: unsplash("1544367567-0f2fcb009e0b", 1800),
      alt: "A woman in a flowing yoga pose silhouetted against an ocean sunset",
    },
    barre: {
      src: commons("0/0c", "Radhika%27s_Balanced_Body.jpg"),
      alt: "A woman extends into a graceful, ballet-inspired studio pose in a bright, plant-filled room",
      credit: "Radhika Karle, CC BY-SA 4.0, via Wikimedia Commons",
    },
    "strength-hiit": {
      src: unsplash("1599901860904-17e6ed7083a0", 1800),
      alt: "A woman holding a downward-facing dog stretch on a studio floor",
    },
    "recovery-restore": {
      src: unsplash("1600334129128-685c5582fd35", 1800),
      alt: "Hands performing a warm hot-stone treatment beside white orchids",
    },
    ballet: {
      src: unsplash("1519925610903-381054cc2a1c", 1800),
      alt: "A dancer in an arabesque ballet pose, silhouetted against a golden sunset sky",
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

export type StudioImage = {
  src: string;
  alt: string;
  credit?: string;
};

function unsplash(id: string, w = 2000) {
  return `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
}

function commons(path: string, file: string, w = 1800) {
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/${w}px-${file}`;
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
  studioExperienceOne: {
    src: unsplash("1552196563-55cd4e45efb3", 1800),
    alt: "A woman seated cross-legged on a mat in a calm, minimal studio",
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
    "reformer-pilates": {
      src: commons("0/0c", "Radhika%27s_Balanced_Body.jpg", 1800),
      alt: "A woman extends into a reformer Pilates pose in a bright studio overlooking a city skyline",
      credit: "Radhika Karle, CC BY-SA 4.0, via Wikimedia Commons",
    },
    "mat-pilates": {
      src: unsplash("1552196563-55cd4e45efb3", 1800),
      alt: "A woman seated cross-legged on a mat in a calm, minimal studio",
    },
    "yoga-flow": {
      src: unsplash("1544367567-0f2fcb009e0b", 1800),
      alt: "A woman in a flowing yoga pose silhouetted against an ocean sunset",
    },
    "mobility-stretch": {
      src: unsplash("1599901860904-17e6ed7083a0", 1800),
      alt: "A woman holding a downward-facing dog stretch on a studio floor",
    },
    "private-sessions": {
      src: commons("5/50", "Mulher_a_praticar_Pilates_num_est%C3%BAdio_completo.jpg", 1800),
      alt: "An instructor guiding a client through a one-on-one Pilates session in a bright studio",
      credit: "Helderoliveira, CC BY-SA 4.0, via Wikimedia Commons",
    },
    "wellness-sessions": {
      src: unsplash("1600334129128-685c5582fd35", 1800),
      alt: "Hands performing a warm hot-stone treatment beside white orchids",
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

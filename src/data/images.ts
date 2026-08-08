export type StudioImage = {
  src: string;
  alt: string;
  credit?: string;
};

function imagekit(id: string, w = 1800) {
  return `https://ik.imagekit.io/rezeve/business/e29c8d72-9f97-4d16-85e7-a044591c66a9/image/editor/${id}.jpg?tr=w-${w}`;
}

// Pexels photos, chosen for authentic Filipino subjects/settings — each ID's
// page confirms the location (Taytay or Dauin, Philippines).
function pexels(id: string) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
}

export const images = {
  hero: {
    src: pexels("36541462"),
    alt: "A woman in a seated lotus meditation pose on an outdoor track in Taytay, Philippines",
  },
  introduction: {
    src: pexels("9154500"),
    alt: "Silhouette of a woman in a graceful yoga pose on the beach at sunset in Dauin, Philippines",
  },
  // Real photo of the studio's class floor — mats, props and arched alcoves.
  studioExperienceOne: {
    src: imagekit("38a6d1e6-7df6-432b-97e9-40edf218eeee", 1800),
    alt: "The studio's class floor, lined with rolled mats beneath arched, softly lit alcoves",
  },
  studioExperienceTwo: {
    src: pexels("36541460"),
    alt: "A woman stretches her arm across her chest during an outdoor recovery session in Taytay, Philippines",
  },
  bookingCta: {
    src: pexels("36541458"),
    alt: "An athlete stretches his leg during a strength warm-up on an outdoor track in Taytay, Philippines",
  },
  services: {
    "mat-pilates": {
      src: pexels("36541468"),
      alt: "A woman seated in a calm, cross-legged pose, viewed from above, in Taytay, Philippines",
    },
    yoga: {
      src: pexels("9154500"),
      alt: "Silhouette of a woman in a graceful yoga pose on the beach at sunset in Dauin, Philippines",
    },
    barre: {
      src: pexels("36541467"),
      alt: "A dancer reaches gracefully to the side during an open-air stretch in Taytay, Philippines",
    },
    "strength-hiit": {
      src: pexels("36541458"),
      alt: "An athlete stretches his leg during a strength warm-up on an outdoor track in Taytay, Philippines",
    },
    "recovery-restore": {
      src: pexels("36541460"),
      alt: "A woman stretches her arm across her chest during an outdoor recovery session in Taytay, Philippines",
    },
    ballet: {
      src: pexels("9155440"),
      alt: "Silhouette of a dancer in an extended, arabesque-like pose on a Philippine beach at sunset",
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

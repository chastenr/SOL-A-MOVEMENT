import type { PolicyDocument } from "@/data/policies";

/**
 * Archived for a future dedicated Studio Rental page. Intentionally not
 * included in the general customer class policies.
 */
export const studioRentalPolicy: PolicyDocument = {
  slug: "studio-rental-terms",
  title: "Studio Rental Terms & Conditions",
  sections: [
    {
      heading: "Overview",
      paragraphs: [
        "These Studio Rental Terms & Conditions (\"Agreement\") govern all studio rental bookings made with Veora Wellness. By purchasing a Studio Rental package, the Client acknowledges that they have read, understood and agreed to the following terms.",
      ],
    },
    {
      heading: "1. Studio Rental",
      paragraphs: [
        "Studio Rental packages provide exclusive access to the reserved studio space for the duration indicated in the purchased package.",
        "Unless otherwise specified, rental fees do not include event styling, decorations, furniture, catering, photography, videography, entertainment or any third-party services.",
      ],
    },
    {
      heading: "2. Booking Validity",
      paragraphs: [
        "Studio Rental packages are valid for thirty (30) calendar days from the date of purchase, and a confirmed booking must be scheduled within that period.",
        "Expired rentals are non-refundable and non-transferable.",
      ],
    },
    {
      heading: "3. Reservation & Availability",
      paragraphs: [
        "Studio rentals are subject to availability. A booking is only considered confirmed once the reservation has been accepted by Veora.",
      ],
    },
    {
      heading: "4. Studio Use",
      paragraphs: [
        "The maximum number of guests permitted is based on the package purchased. Additional guests may be accommodated only upon prior approval and payment of the applicable additional-guest fee.",
      ],
    },
    {
      heading: "5. Decorations & Venue Care",
      paragraphs: [
        "Decorations are welcome provided they are temporary and do not damage the studio or its fixtures.",
        "Prohibited: nails, screws, staples or similar fasteners; glue or permanent adhesives; tapes that leave residue; glitter, confetti or smoke effects; and any installation that may scratch, puncture, stain or otherwise damage the space.",
      ],
    },
    {
      heading: "6. Clean-Up Responsibilities",
      paragraphs: [
        "Before the end of the rental period, clients must remove all decorations and belongings, dispose of trash, return moved furniture or equipment, and leave the studio in its original condition.",
      ],
    },
    {
      heading: "7. Damage to Property",
      paragraphs: [
        "The Client accepts full responsibility for any loss, damage or excessive cleaning resulting from the actions of the Client or their guests.",
      ],
    },
    {
      heading: "8. Right to Refuse Service",
      paragraphs: [
        "Veora reserves the right to refuse, suspend or terminate any rental that violates these Terms & Conditions or studio policies, or that may compromise the safety of guests or the condition of the studio.",
      ],
    },
  ],
};

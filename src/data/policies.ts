export type PolicyDocument = {
  slug: string;
  title: string;
  sections: { heading: string; paragraphs: string[] }[];
};

// Sourced from the studio's published Terms & Conditions, rebranded from
// SPACIO BLNC to Veora. Legal meaning is preserved as published — only the
// brand name has been adapted. Do not alter policy meaning without
// confirming with the studio and, ideally, legal counsel.
export const policyDocuments: PolicyDocument[] = [
  {
    slug: "general-terms",
    title: "General Terms & Conditions",
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "These Terms & Conditions apply to all clients, visitors, members and guests of Veora Wellness.",
        ],
      },
      {
        heading: "1. Bookings",
        paragraphs: [
          "All classes require advance booking through the official booking platform.",
          "Walk-ins are subject to availability.",
          "Studio schedules and instructors may change without prior notice.",
        ],
      },
      {
        heading: "2. Class Minimum",
        paragraphs: [
          "Classes may be cancelled if a minimum number of participants is not met. Clients will receive a replacement credit or rescheduled booking.",
        ],
      },
      {
        heading: "3. Late Arrival",
        paragraphs: [
          "Clients arriving more than 10 minutes after the scheduled class start may not be admitted, to ensure safety and minimize disruption.",
          "Late arrivals may still be charged the applicable class credit.",
        ],
      },
      {
        heading: "4. Memberships & Packages",
        paragraphs: [
          "Memberships and class packages are personal and non-transferable. They may not be resold or shared.",
          "All packages have expiration dates, and unused credits expire unless otherwise stated.",
        ],
      },
      {
        heading: "5. Studio Etiquette",
        paragraphs: [
          "Clients are expected to wear appropriate workout attire, use grip socks when required, wipe down equipment after use if instructed, return props and equipment to their designated areas, and maintain respectful conduct toward instructors, staff and fellow clients.",
        ],
      },
      {
        heading: "6. Personal Belongings",
        paragraphs: [
          "Veora is not liable for any lost, stolen or damaged personal belongings. Lockers are provided for convenience but are used at the client's own risk.",
        ],
      },
      {
        heading: "7. Health & Safety",
        paragraphs: [
          "Clients must disclose any injuries, medical conditions or pregnancy before participating. Veora reserves the right to refuse participation if it believes an activity may be unsafe for the client.",
        ],
      },
      {
        heading: "8. Photography & Privacy",
        paragraphs: [
          "Photography or videography by clients that captures other guests without their consent is prohibited. Veora will handle personal information in accordance with applicable Philippine data privacy laws.",
        ],
      },
      {
        heading: "9. Right to Refuse Service",
        paragraphs: [
          "Veora reserves the right to refuse or terminate services to any individual whose conduct is unsafe, abusive, discriminatory or disruptive, or who fails to comply with these Terms & Conditions.",
        ],
      },
      {
        heading: "10. Amendments",
        paragraphs: [
          "Veora may update these Terms & Conditions from time to time. Continued use of the studio constitutes acceptance of the updated terms.",
        ],
      },
    ],
  },
  {
    slug: "privacy-cookies",
    title: "Privacy & Cookie Notice",
    sections: [
      {
        heading: "Information We Process",
        paragraphs: [
          "When you create an account, purchase a package, make a booking or contact Veora Wellness, we process the information needed to provide that service, such as your name, contact details, account information, bookings, package credits and payment-confirmation records.",
          "Veora uses reasonable administrative and technical safeguards and limits access to personal information to authorized personnel and service providers involved in operating the platform.",
        ],
      },
      {
        heading: "Essential Cookies",
        paragraphs: [
          "Essential cookies support secure sign-in, account sessions, booking functionality, site security, pre-launch access and your saved cookie preference. The website cannot provide all account and booking features without these cookies.",
        ],
      },
      {
        heading: "Optional Cookies",
        paragraphs: [
          "Optional analytics or experience cookies will be used only when they are introduced and the visitor has selected Accept cookies. Veora does not currently use advertising cookies or sell personal information through this website.",
        ],
      },
      {
        heading: "Your Choice",
        paragraphs: [
          "You may accept optional cookies or continue with necessary cookies only. The website saves this preference for up to one year. You can review or change your choice at any time through Cookie settings in the footer, and you can also delete cookies through your browser settings.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "For questions about privacy, cookies or personal information handled through the website, contact bookings@veora.ph.",
        ],
      },
    ],
  },
];

export type FaqTopic = {
  topic: string;
  items: { question: string; answer: string }[];
};

// Sourced from the studio's published FAQ, rebranded from SPACIO BLNC to
// Veora. Facts and policies are preserved as published — only the brand
// name and light grammar have been adapted. Do not alter policy meaning
// without confirming with the studio.
export const faqTopics: FaqTopic[] = [
  {
    topic: "General",
    items: [
      {
        question: "What is Veora?",
        answer:
          "Veora Wellness is a premium boutique movement and wellness studio offering Pilates, yoga, barre, ballet and specialty heated and infrared recovery classes. We believe movement should be accessible, intentional and enjoyable for every body.",
      },
      {
        question: "Where are you located?",
        answer: "We're located on the 2nd Floor of the EMRADEE Building, Molino IV, Bacoor, Cavite.",
      },
      {
        question: "Do I need to be fit or experienced to join?",
        answer:
          "Not at all. Our classes are beginner-friendly while still offering options to challenge experienced practitioners. Our instructors provide modifications throughout each class.",
      },
      {
        question: "What should I wear?",
        answer:
          "Wear comfortable activewear that allows you to move freely. Pilates & Barre: grip socks are highly recommended. Yoga: barefoot is preferred. Ballet: ballet attire is encouraged but not required for beginner classes.",
      },
    ],
  },
  {
    topic: "Booking & Classes",
    items: [
      {
        question: "Do I need to reserve a class?",
        answer: "Yes. All classes are by reservation to ensure a comfortable experience and limited class sizes.",
      },
      {
        question: "How do I book a class?",
        answer:
          "Request a booking through this website — select your class, choose a date and time, and we'll follow up to confirm.",
      },
      {
        question: "Can I walk in without a reservation?",
        answer: "Walk-ins are accepted only if there are available spots, but advance booking is highly recommended.",
      },
      {
        question: "Can I cancel my reservation?",
        answer:
          "Yes. Please cancel at least 12 hours before your scheduled class. Late cancellations or no-shows may result in forfeited class credits.",
      },
      {
        question: "Do you offer private sessions?",
        answer:
          "At this time, we primarily offer small group classes designed to provide personalized instruction in a supportive, community-focused environment. If you're looking for a more exclusive experience, we also offer Studio Rental packages, where you can reserve the studio for a private group and book an instructor to lead a customized class exclusively for you and your guests.",
      },
    ],
  },
  {
    topic: "First-Time Visitors",
    items: [
      {
        question: "How early should I arrive?",
        answer: "Please arrive 15–20 minutes before your first class to check in and familiarize yourself with the studio.",
      },
      {
        question: "What should I bring?",
        answer: "A water bottle, a small towel (optional), and grip socks for Pilates & Barre (highly recommended).",
      },
      {
        question: "Do you provide mats and equipment?",
        answer: "Yes. We provide premium mats and all class equipment.",
      },
    ],
  },
  {
    topic: "Heated & Infrared Classes",
    items: [
      {
        question: "What's the difference between heated and infrared classes?",
        answer:
          "Heated classes use a warm studio environment that improves flexibility and encourages sweating — great for muscle recovery. Infrared classes use infrared heat panels for deep, penetrating warmth that supports circulation and relaxation.",
      },
      {
        question: "Are heated classes safe?",
        answer:
          "Yes, for most healthy individuals. If you're pregnant or have a medical condition, please consult your physician before participating.",
      },
    ],
  },
  {
    topic: "Wellness & Safety",
    items: [
      {
        question: "I have an injury. Can I still join?",
        answer:
          "Many of our classes are low-impact and can be modified to accommodate certain injuries. Please let us know at least 12 hours before your class whenever possible, or inform your instructor before class begins. If you have a significant injury or are under medical care, we recommend getting clearance from your healthcare provider first.",
      },
      {
        question: "I'm pregnant. Can I attend classes?",
        answer: "Yes, provided you have your physician's clearance and join pregnancy-appropriate classes.",
      },
    ],
  },
  {
    topic: "Studio Policies",
    items: [
      {
        question: "What happens if I'm late?",
        answer: "To avoid disrupting class, late arrivals of more than 10 minutes may not be admitted.",
      },
      {
        question: "Can I use my phone during class?",
        answer: "Please keep phones on silent and refrain from using them during class unless necessary.",
      },
      {
        question: "Can I take photos inside the studio?",
        answer: "Yes! We love seeing your experience — just be mindful of other members' privacy.",
      },
    ],
  },
  {
    topic: "Amenities",
    items: [
      { question: "Do you have lockers?", answer: "Yes. Complimentary lockers are available during your visit." },
      { question: "Do you have showers?", answer: "Yes, shower facilities are available for members." },
      { question: "Is parking available?", answer: "Limited parking is available within the building, subject to availability." },
    ],
  },
];

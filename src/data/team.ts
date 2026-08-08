export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  specialties?: string[];
  certifications?: string[];
  image?: string;
  instagram?: string;
};

// No instructors, coaches or team members have been published yet — the
// studio's roster is empty at time of writing. Do not invent placeholder
// staff; add real entries here once the studio provides them.
export const team: TeamMember[] = [];

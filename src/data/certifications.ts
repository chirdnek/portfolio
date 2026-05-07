/**
 * Certifications shown on /certifications.
 *
 * Replace these placeholders with your real certs as you earn them.
 * `credentialUrl` is optional but recommended (links to the verifier).
 * `image` is optional — if set, the card uses it as a square badge;
 *   otherwise the card renders a generated initials monogram.
 */
export interface Certification {
  slug: string;
  title: string;
  issuer: string;
  /** Year + month, formatted however you like (e.g. "May 2025"). */
  issued: string;
  /** Optional human-readable area / focus. */
  category?: string;
  /** Optional credential URL (verifier link). */
  credentialUrl?: string;
  /** Optional badge image path (place under /public/images/certs/). */
  image?: string;
  /** Optional 1-line summary. */
  description?: string;
  /** Set true if currently in progress / not yet awarded. */
  inProgress?: boolean;
}

export const certifications: Certification[] = [
  {
    slug: "ux-foundations-google",
    title: "Foundations of User Experience Design",
    issuer: "Google · Coursera",
    issued: "2025",
    category: "UI/UX",
    description:
      "User-centered design fundamentals, accessibility, and the design thinking process.",
  },
  {
    slug: "responsive-web-design-fcc",
    title: "Responsive Web Design",
    issuer: "freeCodeCamp",
    issued: "2024",
    category: "Front-end",
    description:
      "300+ hours of HTML, CSS, accessibility, flexbox, grid, and responsive layout work.",
  },
  {
    slug: "javascript-algorithms-fcc",
    title: "JavaScript Algorithms & Data Structures",
    issuer: "freeCodeCamp",
    issued: "2024",
    category: "Programming",
    description:
      "ES6, regular expressions, debugging, OOP, functional programming, and algorithmic problem-solving.",
  },
  {
    slug: "figma-essentials",
    title: "Figma Essentials",
    issuer: "Coursera",
    issued: "2024",
    category: "Design tools",
    description:
      "Component architecture, auto-layout, variants, and design-token workflows in Figma.",
  },
  {
    slug: "flutter-mobile-dev",
    title: "Flutter & Dart — Mobile Development",
    issuer: "Self-paced",
    issued: "In progress",
    category: "Mobile",
    inProgress: true,
    description:
      "Cross-platform mobile architecture, state management, and shipping the FishFresh capstone.",
  },
];

export function getCertBySlug(slug: string): Certification | undefined {
  return certifications.find((c) => c.slug === slug);
}

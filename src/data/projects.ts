export interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  image?: string;
  /** Additional screenshots for the detail page gallery. */
  gallery?: string[];
  href?: string;
  repo?: string;
  featured?: boolean;
  year?: string;
  role?: string;
}

export const projects: Project[] = [
  {
    slug: "fishfresh",
    title: "FishFresh",
    description:
      "A mobile-based computer-vision system that grades fish freshness in real time — built for fishers and small markets across Zamboanga.",
    longDescription:
      "FishFresh is a capstone project that turns a phone camera into a freshness scanner. The user points it at a fish; an on-device model classifies the catch as fresh, slightly stale, or spoiled in under a second. I built the Flutter app, designed the UI/UX end-to-end, and helped train the computer-vision model on a locally-collected dataset. The interface is meant for one-handed use in a wet market — high-contrast type, large tap targets, and a result screen that explains *why* the verdict came back, not just *what*.",
    tags: ["Flutter", "Computer Vision", "Mobile", "UI/UX"],
    image: "/images/projects/fishfres.jpg",
    href: "#",
    repo: "https://github.com/chirdnek",
    featured: true,
    year: "2025",
    role: "Programmer & UI/UX Designer",
  },
  {
    slug: "saas-cater-pro",
    title: "SaaS Cater Pro",
    description:
      "A multi-tenant catering platform — booking, menu builder, payment splits, and an admin dashboard for venue partners.",
    longDescription:
      "SaaS Cater Pro is a B2B platform I led the UI/UX on, from research to a production-ready system. Caterers compose menus from typed blocks, accept bookings with split payments, and track orders from a single dashboard. The design language leans on clarity over decoration — dense data tables, clear empty states, and a calendar that actually fits a busy week without scrolling. Accessibility was non-negotiable: 4.5:1 contrast minimums everywhere, full keyboard nav, screen-reader–friendly labels.",
    tags: ["Figma", "UI/UX", "Design System", "Accessibility"],
    image: "/images/projects/saas.png",
    href: "#",
    featured: true,
    year: "2025",
    role: "UI/UX Designer",
  },
  {
    slug: "pentaxite",
    title: "Pentaxite",
    description:
      "End-to-end identity and product system for a creative-services studio — visual language, components, and a marketing site.",
    longDescription:
      "Pentaxite was an identity-and-system project that ran from logo sketches to a shipped marketing site. I built the brand foundation in Figma — type scale, color tokens, motion principles — then translated each token into a component library that the dev team could lift directly into code. The result was a single source of truth: change a token in Figma, ship it on the site by next deploy.",
    tags: ["Figma", "Brand", "Design Tokens", "Web"],
    image: "/images/projects/pentaxite.png",
    href: "#",
    featured: true,
    year: "2025",
    role: "Product Designer",
  },
  {
    slug: "vocabvoyage",
    title: "VocabVoyage",
    description:
      "A gamified language-learning app turning daily commutes into vocabulary expeditions with spaced-repetition cards.",
    longDescription:
      "VocabVoyage is a mobile app that gamifies vocabulary practice — you board virtual flights, earn miles for streaks, and unlock destination decks as you progress. I designed the spaced-repetition model around the Leitner system, with the daily cap tuned so commute-length sessions feel finishable but never trivial. Built with Flutter and a small Firebase backend for sync.",
    tags: ["Flutter", "Firebase", "Mobile", "UI/UX"],
    image: "/images/projects/vocab.png",
    repo: "https://github.com/chirdnek",
    year: "2024",
    role: "Mobile Developer",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  image?: string;
  href?: string;
  repo?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "lumen",
    title: "Lumen",
    description:
      "A real-time analytics dashboard for tracking product usage, with sub-second query response and live charts.",
    longDescription:
      "Lumen is a self-serve analytics dashboard built for small product teams that have outgrown spreadsheets but don't need a full data platform. It ingests events via a typed SDK, stores them in a columnar warehouse, and renders sub-second charts on top. The frontend is Next.js + React Server Components for fast initial loads, with client-side updates streamed over a WebSocket. Built end-to-end in two months.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "WebSockets"],
    image: "/images/projects/lumen.png",
    href: "#",
    repo: "#",
    featured: true,
  },
  {
    slug: "atlas",
    title: "Atlas",
    description:
      "A content management system designed for editors, not engineers — block-based authoring with live preview.",
    longDescription:
      "Atlas is a headless CMS focused on the editor experience. Authors compose pages from typed content blocks, see a pixel-accurate preview as they type, and publish with one click. The schema is defined in TypeScript, so the same types power the editor, the API, and the rendered site. I built the block editor on top of Tiptap and added inline AI suggestions for tone and length.",
    tags: ["Next.js", "TypeScript", "Tiptap", "tRPC"],
    image: "/images/projects/atlas.png",
    href: "#",
    repo: "#",
    featured: true,
  },
  {
    slug: "pulse",
    title: "Pulse",
    description:
      "An infrastructure status page that auto-detects incidents and writes the first draft of the post-mortem.",
    longDescription:
      "Pulse watches your services, opens an incident channel when latency or error budgets are breached, and drafts a timeline post-mortem from the actual signals — alerts, deploys, traces. The first draft is usually 80% there, which is the hard part. Built with a Go backend for ingestion and a React frontend for the public status page and the internal incident view.",
    tags: ["Go", "React", "PostgreSQL", "OpenTelemetry"],
    image: "/images/projects/pulse.png",
    href: "#",
    repo: "#",
    featured: true,
  },
  {
    slug: "forge",
    title: "Forge",
    description:
      "A developer CLI that scaffolds, lints, and ships TypeScript monorepos with one command per task.",
    longDescription:
      "Forge is the toolchain I wished existed when I was setting up my fifth monorepo. One command to scaffold a new package with the right tsconfig, lint config, and CI wiring. Another to run all tests across the workspace with smart caching. A third to release everything that changed. Plugin architecture so teams can extend it with their own commands.",
    tags: ["TypeScript", "Node.js", "CLI", "pnpm"],
    image: "/images/projects/forge.png",
    repo: "#",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

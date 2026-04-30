import Hero from "@/components/sections/Hero";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import StickyScrollSection from "@/components/ui/StickyScrollSection";
import SectionDivider from "@/components/ui/SectionDivider";
import Marquee from "@/components/ui/Marquee";
import WordReveal from "@/components/ui/WordReveal";
import { getFeaturedProjects, projects } from "@/data/projects";
import Link from "next/link";

const SPANS = ["2x2", "1x1", "1x1", "2x1"] as const;

const TECH_STACK = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Tailwind",
  "Framer Motion",
  "tRPC",
  "GraphQL",
  "Prisma",
  "Vercel",
  "Figma",
];

const PROCESS_ITEMS = [
  {
    eyebrow: "Discovery",
    title: "Understand the actual problem.",
    description:
      "Before writing a line of code, I map the constraints, the user, and the metric that will tell us we won. Most projects fail here, not in execution.",
  },
  {
    eyebrow: "Design",
    title: "Design at the boundary.",
    description:
      "I sketch in the medium — Figma for layout, code for interactions. The earlier the prototype touches reality, the fewer surprises later.",
  },
  {
    eyebrow: "Build",
    title: "Ship small, ship often.",
    description:
      "TypeScript everywhere, tests where they earn their keep, and a deployment pipeline that lets us push to production from day one.",
  },
  {
    eyebrow: "Refine",
    title: "Polish is a feature.",
    description:
      "The 5% at the end — micro-interactions, error states, performance budgets — is what separates a working product from one people remember.",
  },
];

export default function Home() {
  const featured = getFeaturedProjects();
  const rest = projects.filter((p) => !featured.includes(p));
  const display = [...featured, ...rest].slice(0, 4);

  return (
    <>
      <Hero />

      {/* Tech stack marquee */}
      <section className="border-y border-subtle py-2 bg-white/[0.008]">
        <Marquee items={TECH_STACK} speed={42} />
      </section>

      {/* Selected work */}
      <SectionDivider index="01" total="03" label="Selected work" />
      <section className="pt-8 pb-32 sm:pb-40">
        <div className="container-custom">
          <RevealOnScroll>
            <div className="flex items-end justify-between mb-12 gap-4">
              <h2
                className="font-semibold tracking-display text-fg max-w-3xl leading-[1.05]"
                style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
              >
                A few things I&apos;ve shipped recently.
              </h2>
              <Link
                href="/projects"
                className="link-underline text-sm shrink-0 hidden sm:inline-block"
              >
                View all →
              </Link>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15} blur={false}>
            <BentoGrid>
              {display.map((p, i) => (
                <BentoCard
                  key={p.slug}
                  span={SPANS[i] ?? "1x1"}
                  href={`/projects/${p.slug}`}
                  eyebrow={p.featured ? "Featured" : "Project"}
                  title={p.title}
                  description={p.description}
                  tags={p.tags}
                  image={p.image}
                  index={i}
                />
              ))}
            </BentoGrid>
          </RevealOnScroll>
        </div>
      </section>

      {/* Process */}
      <SectionDivider index="02" total="03" label="How I work" />
      <section className="pt-8 pb-32 sm:pb-40">
        <StickyScrollSection
          heading="A simple, opinionated process."
          items={PROCESS_ITEMS}
          pinned={
            <div className="text-center px-8">
              <div className="mono-label mb-4">Process</div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight">
                Quietly opinionated.
                <br />
                <span className="text-fg-muted">Loudly accountable.</span>
              </p>
            </div>
          }
        />
      </section>

      {/* Footer CTA */}
      <SectionDivider index="03" total="03" label="Let's talk" />
      <section className="pt-12 pb-32 sm:pb-48">
        <div className="container-custom max-w-4xl">
          <RevealOnScroll blur={false}>
            <div className="mono-label mb-6">Have a project in mind?</div>
          </RevealOnScroll>

          <WordReveal
            text="Let's build something quietly remarkable."
            as="h2"
            className="font-semibold tracking-display leading-[0.95] text-fg mb-12"
            style={{ fontSize: "clamp(2.5rem, 9vw, 6rem)" }}
          />

          <RevealOnScroll delay={0.4} blur={false}>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 text-base sm:text-lg text-fg"
              >
                <span className="link-underline">Start a conversation</span>
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle text-fg-muted transition-all duration-300
                    group-hover:bg-accent group-hover:text-white group-hover:border-[color:var(--accent)]
                    group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <a
                href="mailto:nexzysintelligence@gmail.com"
                className="text-fg-muted hover:text-fg text-sm transition-colors"
              >
                nexzysintelligence@gmail.com
              </a>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}

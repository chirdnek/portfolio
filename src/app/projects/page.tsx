import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/data/projects";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionDivider from "@/components/ui/SectionDivider";
import ProjectCanvas from "@/components/projects/ProjectCanvas";

export const metadata: Metadata = {
  title: "Work — Kendrick Serrano",
  description:
    "Selected UI/UX design work — mobile apps, design systems, and accessible web experiences designed in Figma and shipped in Flutter and React.",
};

export default function ProjectsPage() {
  // All unique tags across projects, sorted by frequency
  const tagCounts = new Map<string, number>();
  for (const p of projects) {
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
  }
  const allTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  return (
    <>
      <section className="pt-32 pb-12">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <div className="mono-label mb-6">Selected work — 2024 / 2026</div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h1
              className="font-semibold tracking-display leading-[0.95] text-fg max-w-4xl mb-10"
              style={{ fontSize: "clamp(2.5rem, 9vw, 6.5rem)" }}
            >
              Things I&apos;ve shipped<span className="text-accent">.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <p className="max-w-2xl text-base sm:text-lg text-fg-muted leading-[1.7]">
              A selection of {projects.length} projects across UI/UX, mobile,
              and design systems. Each one was designed end-to-end — research,
              wireframes, visual system, and accessibility-first build.
            </p>
          </RevealOnScroll>

          {/* Tools chips */}
          <RevealOnScroll delay={0.2} blur={false}>
            <div className="mt-12 flex flex-wrap items-center gap-2">
              <span className="mono-label mr-2">Tools —</span>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 border border-subtle rounded-full text-fg-muted hover:text-fg hover:border-strong transition-colors duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <SectionDivider index="01" total="01" label="All projects" />

      {/* Pan/zoom canvas — full-bleed 3×3 grid of project artwork */}
      <section className="relative w-full">
        <ProjectCanvas />
      </section>

      {/* Footer CTA */}
      <section className="border-t border-subtle py-24 sm:py-32">
        <div className="container-custom max-w-3xl text-center">
          <RevealOnScroll>
            <div className="mono-label mb-6">More work in progress</div>
            <h2
              className="font-semibold tracking-display text-fg mb-8 leading-[1.05]"
              style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)" }}
            >
              Have a project that needs the same care?
            </h2>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 text-base sm:text-lg text-fg"
            >
              <span className="link-underline">Let&apos;s build it together</span>
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle text-fg-muted transition-all duration-300 group-hover:bg-accent group-hover:text-white group-hover:border-[color:var(--accent)] group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import ExperienceTimeline from "@/components/sections/ExperienceTimeline";
import DarkDimensionFX from "@/components/effects/DarkDimensionFx";
import MandalaPortal from "@/components/effects/MandalaPortalClient";
import EldritchHeading from "@/components/effects/EldritchHeading";
import "@/components/effects/DarkDimension.css";

export const metadata: Metadata = {
  title: "About | KENTO_O — Dark Dimension",
  description:
    "An emissary between code and chaos. Learn more about me, my background, and what drives my work.",
};

const experiences = [
  {
    role: "Senior Developer",
    company: "Company Name",
    period: "2022 — Present",
    description:
      "Led development of key product features, improved performance by 40%, mentored junior developers.",
  },
  {
    role: "Frontend Developer",
    company: "Another Company",
    period: "2020 — 2022",
    description:
      "Built responsive UIs with React and TypeScript, collaborated closely with design and backend teams.",
  },
  {
    role: "Junior Developer",
    company: "Startup Name",
    period: "2018 — 2020",
    description:
      "Full-stack development using Node.js and React, shipped multiple customer-facing features.",
  },
];

export default function AboutPage() {
  return (
    <div className="dd-root" data-testid="about-page-root">
      {/* Global Dark Dimension FX — particles, crimson haze, runes */}
      <DarkDimensionFX />

      {/* ───────────────────── INTRO ───────────────────── */}
      <section className="pt-32 pb-24 relative overflow-hidden" data-testid="about-intro">
        {/* Rotating mandala portal behind headline */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 md:-right-40 opacity-60 mix-blend-screen"
          aria-hidden
        >
          <MandalaPortal size={720} spinDuration={90} />
        </div>

        {/* Secondary counter-rotating sling ring */}
        <div
          className="pointer-events-none absolute top-40 -left-32 opacity-30 mix-blend-screen"
          aria-hidden
        >
          <MandalaPortal size={420} spinDuration={140} reverse />
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <p className="dd-eyebrow mb-6">
              <span className="dd-eyebrow__dot" aria-hidden />
              Transmissions from the Dark Dimension
            </p>

            <h1
              className="dd-display mb-10"
              style={{ fontSize: "clamp(2.75rem, 9vw, 6rem)" }}
            >
              <EldritchHeading text="About Me" />
            </h1>

            <div className="space-y-6 text-lg leading-relaxed dd-body">
              <p>
                Hi, I&apos;m{" "}
                <span className="dd-name">KENTO_O</span>
                {" "}— a creative developer based in{" "}
                <span className="dd-placeholder">[City, Country]</span>. I build
                fast, accessible, and well-crafted web experiences.
              </p>
              <p>
                I&apos;ve been writing code professionally for over 5 years,
                working across the full stack with a particular love for{" "}
                <em className="dd-em">React</em>,{" "}
                <em className="dd-em">TypeScript</em>, and clean system design.
                I care deeply about developer experience and shipping things
                that actually work for users.
              </p>
              <p>
                Outside of work I enjoy{" "}
                <span className="dd-placeholder">[your hobbies]</span>, which
                keeps me sane and often sparks unexpected ideas for projects
                that pierce the veil.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-8">
              <Link href="/contact" className="dd-btn-primary">
                <span className="dd-btn-primary__glyph" aria-hidden />
                <span>Contact Me</span>
                <span className="dd-btn-primary__arrow" aria-hidden>→</span>
              </Link>
              <a
                href="/CV/CV.pdf"
                download="CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="dd-link-underline"
              >
                Download CV
              </a>
            </div>
          </div>
        </div>

        {/* Dark-matter horizon at the bottom of hero */}
        <div className="dd-horizon" aria-hidden />
      </section>

      {/* ───────────────────── EXPERIENCE TIMELINE ───────────────────── */}
      <ExperienceTimeline experiences={experiences} />

      {/* ───────────────────── EDUCATION ───────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
          aria-hidden
        >
          <MandalaPortal size={900} spinDuration={220} />
        </div>

        <div className="container-custom relative z-10">
          <h2 className="dd-section-title">
            <span className="dd-section-title__mark" aria-hidden>✦</span>
            Education
          </h2>

          <div className="mt-14 dd-grimoire max-w-2xl">
            <div className="dd-grimoire__corner dd-grimoire__corner--tl" aria-hidden />
            <div className="dd-grimoire__corner dd-grimoire__corner--tr" aria-hidden />
            <div className="dd-grimoire__corner dd-grimoire__corner--bl" aria-hidden />
            <div className="dd-grimoire__corner dd-grimoire__corner--br" aria-hidden />

            <div className="flex flex-col sm:flex-row gap-8 p-10">
              <div className="sm:w-44 shrink-0">
                <div className="dd-year-stamp">2014 — 2018</div>
              </div>
              <div>
                <h3 className="dd-education-degree">BS Information Technology</h3>
                <p className="dd-education-school">Western Mindanao State University</p>
                <p className="dd-education-desc">
                  Graduated with honors. Focused on algorithms, software
                  engineering, and distributed systems — with a personal minor
                  in the forbidden arts of frontend performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

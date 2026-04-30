import type { Metadata } from "next";
import Link from "next/link";
import ExperienceTimeline from "@/components/sections/ExperienceTimeline";

export const metadata: Metadata = {
  title: "About | KENTO_O",
  description:
    "Creative developer building fast, accessible, well-crafted web experiences.",
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

const focusAreas = ["React", "TypeScript", "Next.js", "System design"];

export default function AboutPage() {
  return (
    <div data-testid="about-page-root">
      {/* ───────────────────── INTRO ───────────────────── */}
      <section
        className="relative pt-32 pb-32 overflow-hidden"
        data-testid="about-intro"
      >
        {/* Faint accent gradient — single soft glow, not theatrical */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "var(--accent, #4d65ff)" }}
        />

        <div className="container-custom relative">
          {/* Magazine-style top index row */}
          <div className="flex items-center justify-between mb-16 text-[11px] uppercase tracking-[0.32em] text-white/40">
            <span className="flex items-center gap-3">
              <span aria-hidden className="block w-6 h-px bg-white/30" />
              01 — Profile
            </span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="relative inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
              >
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </span>
              Available for work
            </span>
          </div>

          {/* Editorial heading */}
          <h1
            className="font-bold tracking-tight leading-[0.95] mb-16"
            style={{
              fontSize: "clamp(3rem, 11vw, 8.5rem)",
              letterSpacing: "-0.035em",
            }}
          >
            About{" "}
            <span
              className="italic font-light"
              style={{
                fontFamily: "var(--font-geist-mono), Georgia, serif",
              }}
            >
              me.
            </span>
          </h1>

          {/* Two-column editorial body: bio left, meta panel right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Bio column */}
            <div className="lg:col-span-7 space-y-6 text-base sm:text-lg leading-[1.75] text-white/65">
              <p className="text-xl sm:text-2xl text-white leading-snug font-light">
                I&apos;m Kendrick — a creative developer based in Zamboanga
                City, Philippines. I build fast, accessible, and well-crafted
                web experiences.
              </p>
              <p>
                Five years of professional experience across the full stack,
                with a focus on React, TypeScript, and clean system design.
                I care about developer experience and shipping things that
                work for users.
              </p>
              <p>
                Outside of work, playing mobile games keeps me grounded and
                often sparks ideas for what to build next.
              </p>

              <div className="pt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
                <Link href="/contact" className="btn-primary">
                  Contact me
                </Link>
                <a
                  href="/CV/CV.pdf"
                  download="CV.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  Download CV
                </a>
              </div>
            </div>

            {/* Meta panel — magazine sidebar */}
            <aside className="lg:col-span-5 lg:pl-12 lg:border-l lg:border-white/10">
              <dl className="space-y-8">
                <MetaRow label="Based in" value="Zamboanga City, PH" />
                <MetaRow label="Experience" value="5+ years, full stack" />
                <MetaRow label="Currently" value="Open to opportunities" />

                <div>
                  <dt className="text-[10px] uppercase tracking-[0.32em] text-white/35 mb-4">
                    Focus
                  </dt>
                  <dd className="flex flex-wrap gap-2">
                    {focusAreas.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1.5 border border-white/15 rounded-full text-white/70 hover:text-white hover:border-white/40 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {/* ───────────────────── EXPERIENCE ───────────────────── */}
      <SectionDivider index="02" label="Trajectory" />
      <ExperienceTimeline experiences={experiences} />

      {/* ───────────────────── EDUCATION ───────────────────── */}
      <SectionDivider index="03" label="Education" />
      <section className="py-32">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-3">
              <div
                className="text-white/30 font-light leading-none"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                2014
                <span className="block text-white/20 text-base mt-1">
                  — 2018
                </span>
              </div>
            </div>

            <div className="lg:col-span-9 lg:pl-12 lg:border-l lg:border-white/10">
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/40 mb-3">
                Bachelor&apos;s Degree
              </p>
              <h3
                className="font-medium mb-3"
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                BS Information Technology
              </h3>
              <p className="text-white/70 mb-6 text-lg">
                Western Mindanao State University
              </p>
              <p className="text-white/45 leading-relaxed max-w-xl">
                Graduated with honors. Focused on algorithms, software
                engineering, and distributed systems.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────── helpers ───────────────────── */

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.32em] text-white/35 mb-2">
        {label}
      </dt>
      <dd className="text-base text-white/85">{value}</dd>
    </div>
  );
}

function SectionDivider({
  index,
  label,
}: {
  index: string;
  label: string;
}) {
  return (
    <div className="container-custom">
      <div className="flex items-center gap-6 py-8 border-t border-white/10 text-[11px] uppercase tracking-[0.32em] text-white/40">
        <span>{index}</span>
        <span aria-hidden className="flex-1 h-px bg-white/10" />
        <span>{label}</span>
      </div>
    </div>
  );
}

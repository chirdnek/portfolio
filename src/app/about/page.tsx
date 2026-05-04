import type { Metadata } from "next";
import Link from "next/link";
import ExperienceTimeline from "@/components/sections/ExperienceTimeline";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionDivider from "@/components/ui/SectionDivider";

export const metadata: Metadata = {
  title: "About — Kendrick Serrano",
  description:
    "Information Technology student at Western Mindanao State University. UI/UX designer and full-stack web/app developer based in Tugbungan, Zamboanga City.",
};

const experiences = [
  {
    role: "Programmer & UI/UX Designer",
    company: "FishFresh — Capstone",
    period: "Aug 2025 — Present",
    description:
      "Mobile-based computer-vision system for real-time fish freshness assessment. Built the Flutter app, designed the end-to-end UI/UX, and shipped a result screen built for one-handed wet-market use.",
  },
  {
    role: "UI/UX Designer",
    company: "SaaS Cater Pro",
    period: "Jan 2025 — May 2025",
    description:
      "Led the UI/UX on a multi-tenant catering platform — booking, menu builder, payment splits, admin dashboard. Accessibility-first: AA contrast, full keyboard nav, screen-reader–friendly labels.",
  },
  {
    role: "BS Information Technology",
    company: "Western Mindanao State University",
    period: "Aug 2022 — Present",
    description:
      "Programming, networking, and system development. Hands-on coursework across software components, databases, and frontend/mobile delivery.",
  },
];

const focusAreas = [
  "UI/UX Design",
  "Figma",
  "Flutter",
  "React",
  "HTML / CSS / JS",
  "Firebase",
  "SQL",
  "Accessibility",
  "Responsive Design",
];

export default function AboutPage() {
  return (
    <>
      {/* ── INTRO ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Single subtle accent bloom */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.10] blur-3xl"
          style={{ background: "var(--accent)" }}
        />

        <div className="container-custom relative">
          {/* Magazine-style top index row */}
          <RevealOnScroll blur={false}>
            <div className="flex items-center justify-between mb-16 mono-label">
              <span className="flex items-center gap-3">
                <span aria-hidden className="block w-6 h-px bg-[color:var(--border-strong)]" />
                01 — Profile
              </span>
              <span className="flex items-center gap-2 normal-case tracking-[0.18em]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Available for work
              </span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h1
              className="font-semibold tracking-display leading-[0.92] text-fg mb-16"
              style={{ fontSize: "clamp(3rem, 11vw, 8.5rem)" }}
            >
              About{" "}
              <span className="font-mono italic font-light text-fg-muted">
                me<span className="text-accent">.</span>
              </span>
            </h1>
          </RevealOnScroll>

          {/* Two-column editorial body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-7 space-y-6 text-base sm:text-lg leading-[1.75] text-fg-muted">
              <RevealOnScroll delay={0.1}>
                <p className="text-xl sm:text-2xl text-fg leading-snug font-light">
                  I&apos;m Kendrick — an Information Technology student at
                  Western Mindanao State University, based in Tugbungan,
                  Zamboanga City.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={0.2}>
                <p>
                  I focus on UI/UX design and shipping accessible web and
                  mobile products — Figma for the foundations, Flutter and
                  React for the build. I enjoy hands-on work that involves
                  real software components: design systems, computer vision,
                  data layers, the small details that make a product feel
                  considered.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={0.3}>
                <p>
                  My goal is to become a competent IT professional who builds
                  efficient, secure digital solutions for modern challenges —
                  starting with the communities and businesses around
                  Zamboanga.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={0.4} blur={false}>
                <div className="pt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
                  <Link href="/contact" className="btn-primary">
                    Contact me
                    <span aria-hidden>→</span>
                  </Link>
                  <a
                    href="/CV/CV.pdf"
                    download="CV.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-sm"
                  >
                    Download CV
                  </a>
                </div>
              </RevealOnScroll>
            </div>

            {/* Meta sidebar */}
            <RevealOnScroll delay={0.25} blur={false}>
              <aside className="lg:col-span-5 lg:pl-12 lg:border-l lg:border-subtle">
                <dl className="space-y-8">
                  <MetaRow label="Based in" value="Tugbungan, Zamboanga City" />
                  <MetaRow label="Studying" value="BS IT, WMSU (2022 — Present)" />
                  <MetaRow label="Currently" value="Open to internships & freelance" />

                  <div>
                    <dt className="mono-label mb-4">Focus</dt>
                    <dd className="flex flex-wrap gap-2">
                      {focusAreas.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1.5 border border-subtle rounded-full text-fg-muted hover:text-fg hover:border-strong transition-colors duration-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </aside>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ── */}
      <SectionDivider index="02" total="03" label="Trajectory" />
      <ExperienceTimeline experiences={experiences} />

      {/* ── EDUCATION ── */}
      <SectionDivider index="03" total="03" label="Education" />
      <section className="py-32">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-3">
                <div
                  className="text-fg-faint font-light leading-none font-mono"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                >
                  2022
                  <span className="block text-fg-faint text-base mt-1">
                    — Present
                  </span>
                </div>
              </div>

              <div className="lg:col-span-9 lg:pl-12 lg:border-l lg:border-subtle">
                <p className="mono-label mb-3">Bachelor&apos;s Degree (in progress)</p>
                <h3
                  className="font-semibold mb-3 text-fg tracking-tight"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                >
                  BS Information Technology
                </h3>
                <p className="text-fg-muted mb-6 text-lg">
                  Western Mindanao State University · Baliwasan, Zamboanga City
                </p>
                <p className="text-fg-faint leading-relaxed max-w-xl">
                  Programming, networking, and system development. Capstone:
                  FishFresh — a mobile computer-vision system for real-time
                  fish freshness assessment.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mono-label mb-2">{label}</dt>
      <dd className="text-base text-fg">{value}</dd>
    </div>
  );
}

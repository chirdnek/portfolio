import Hero from "@/components/sections/Hero";
import Robot3D from "@/components/sections/Robot3D";
import SpeechBubble from "@/components/ui/SpeechBubble";
import SplineCarousel, { type SplineApp } from "@/components/ui/SplineCarousel";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import ProcessSection from "@/components/sections/ProcessSection";
import AppDevHeading from "@/components/sections/AppDevHeading";
import WaveTransition from "@/components/sections/WaveTransition";
import SectionDivider from "@/components/ui/SectionDivider";
import WordReveal from "@/components/ui/WordReveal";
import { getFeaturedProjects, projects } from "@/data/projects";
import Link from "next/link";

const SPANS = ["2x2", "1x1", "1x1", "2x1"] as const;

// Add more entries as you build new Spline scenes — each one is its own
// share URL. The carousel preloads the next one automatically.
const SHOWCASE_APPS: SplineApp[] = [
  {
    url: "https://my.spline.design/dynamiciphonemockup-VE9j43yTdZ9drbZvGuRYaW1V/",
    name: "FishFresh",
    eyebrow: "Capstone · 2025",
    description:
      "Point your camera at a fish — get its species in seconds. A capstone build that fuses two AI models into one pipeline: YOLOv8 spots the catch, ResNet50 names it. Built for fishers, vendors, and the seafood-curious.",
    stack: [
      { name: "Flutter", slug: "flutter", note: "cross-platform UI" },
      { name: "Firebase", slug: "firebase", note: "auth + realtime" },
      { name: "YOLOv8", note: "object detection" },
      { name: "ResNet50", note: "deep classification" },
    ],
  },
  {
    url: "https://my.spline.design/dynamiciphonemockup-81yuRL9V5HhZOVKpaZ4XqEwp/",
    name: "Calarian Connect",
    eyebrow: "Mobile · 2025",
    description:
      "The barangay, but in your pocket. Skip the line, skip the paperwork — request documents, track requests, and stay connected to your community without ever leaving the couch.",
    stack: [
      { name: "React Native", slug: "react", note: "mobile-first" },
      { name: "Supabase", slug: "supabase", note: "auth · db · storage" },
    ],
  },
  {
    url: "https://my.spline.design/dynamiciphonemockup-LkdZHfqZ9GwRpn9Boi8AF35j/",
    name: "VocabVoyage",
    eyebrow: "Mobile · 2025",
    description:
      "Spelling, but it slaps. A native Android game that turns vocabulary practice into a tap-happy adventure for kids — with offline progress that follows them anywhere.",
    stack: [
      { name: "Kotlin", slug: "kotlin", note: "pure native Android" },
      { name: "SQLite", slug: "sqlite", note: "local-first storage" },
    ],
  },
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

      {/* Process — sits directly under the hero as the first narrative beat */}
      <SectionDivider index="01" total="03" label="How I work" />
      <ProcessSection
        heading="A simple, opinionated process."
        items={PROCESS_ITEMS}
      />

      {/* Scroll-driven wave transition between Process and AppDev */}
      <WaveTransition />

      {/* 3D extruded title bridge */}
      <AppDevHeading />

      {/* Spline 3D scene carousel — full viewport, multi-app showcase */}
      <section
        className="relative w-full"
        style={{ height: "100svh", background: "var(--background)" }}
      >
        <SplineCarousel apps={SHOWCASE_APPS} />
      </section>

      {/* Selected work */}
      <SectionDivider index="02" total="03" label="Selected work" />
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

      {/* Footer CTA */}
      <SectionDivider index="03" total="03" label="Let's talk" />
      <section className="pt-12 pb-32 sm:pb-48">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Text column */}
            <div className="lg:col-span-7">
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
                      className="flex h-9 w-9 items-center justify-center border border-[color:var(--border-strong)] text-fg-muted transition-all duration-300
                        group-hover:bg-[color:var(--foreground)] group-hover:text-[color:var(--background)] group-hover:border-[color:var(--foreground)]
                        group-hover:translate-x-0.5"
                      style={{ borderRadius: "2px" }}
                    >
                      →
                    </span>
                  </Link>
                  <a
                    href="mailto:kendrickserrano7@gmail.com"
                    className="text-fg-muted hover:text-fg text-sm transition-colors"
                  >
                    kendrickserrano7@gmail.com
                  </a>
                </div>
              </RevealOnScroll>
            </div>

            {/* Robot column — bigger canvas + speech bubble overlay */}
            <div className="lg:col-span-5">
              <div
                className="relative w-full"
                style={{ height: "min(82vh, 760px)" }}
              >
                {/* Speech bubble — sits above the robot's head */}
                <div className="absolute top-4 left-2 sm:left-6 z-10 max-w-[18rem] pointer-events-none">
                  <SpeechBubble />
                </div>
                <Robot3D />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

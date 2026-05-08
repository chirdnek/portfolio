"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import RevealOnScroll from "../ui/RevealOnScroll";
import WordReveal from "../ui/WordReveal";

export interface ProcessItem {
  eyebrow: string;
  title: string;
  description: string;
}

interface ProcessSectionProps {
  heading: string;
  items: ProcessItem[];
}

/**
 * ProcessSection
 *
 * Desktop (md+): vertical scroll drives a horizontal slide track. The section
 * is `items.length × 100vh` tall, with a sticky `h-screen` viewport pinned at
 * the top. Inside, an overflow-hidden wrapper holds a horizontal flex track
 * whose `x` is bound to the scroll progress.
 *
 * Mobile (<md): falls back to a stacked vertical list — horizontal-pinned
 * scrolling is jarring on touch.
 */
export default function ProcessSection({ heading, items }: ProcessSectionProps) {
  return (
    <>
      <div className="hidden md:block">
        <HorizontalProcess heading={heading} items={items} />
      </div>
      <div className="md:hidden">
        <StackedProcess heading={heading} items={items} />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Desktop: horizontal slide track
 * ───────────────────────────────────────────────────────────────────────── */

function HorizontalProcess({ heading, items }: ProcessSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Track is items.length × 100vw wide. To slide from slide 0 → slide N-1,
  // translate the track by (N-1) / N of its own width to the left.
  const xPercent = ((items.length - 1) / items.length) * 100;
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${xPercent}%`]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `calc(100vh + ${(items.length - 1) * 40}vh)` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-[color:var(--background)]">
        {/* Header overlay — anchored to the top of the pinned viewport */}
        <div className="absolute inset-x-0 top-0 z-10 pt-12 sm:pt-20">
          <div className="container-custom">
            <WordReveal
              text={heading}
              as="h2"
              className="font-semibold tracking-display text-fg leading-[1.0] max-w-5xl"
              style={{
                fontSize: "clamp(2rem, 5.2vw, 4.25rem)",
                letterSpacing: "-0.025em",
              }}
            />
          </div>
        </div>

        {/* Horizontal track */}
        <motion.div
          style={{ x, width: `${items.length * 100}vw` }}
          className="flex h-full"
        >
          {items.map((item, i) => (
            <Slide
              key={item.title}
              item={item}
              index={i}
              total={items.length}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Slide({
  item,
  index,
  total,
}: {
  item: ProcessItem;
  index: number;
  total: number;
}) {
  return (
    <article
      className="h-full flex items-center"
      style={{ width: "100vw", flexShrink: 0 }}
    >
      <div className="container-custom w-full pt-32 sm:pt-44 pb-24">
        <div className="grid grid-cols-12 gap-x-8 lg:gap-x-12 items-center">
          {/* Numeral — fills the left half of the slide */}
          <div className="col-span-12 lg:col-span-5">
            <span
              aria-hidden
              className="font-display block leading-[0.82] text-fg"
              style={{
                fontSize: "clamp(6rem, 16vw, 14rem)",
                letterSpacing: "-0.04em",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mono-label text-fg-faint mt-5 block tracking-[0.18em]">
              {item.eyebrow} ·{" "}
              <span className="text-fg-muted">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </span>
          </div>

          {/* Content — title + description */}
          <div className="col-span-12 lg:col-span-7 max-w-2xl">
            <h3
              className="font-semibold tracking-display text-fg leading-[1.05] mb-6"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)",
                letterSpacing: "-0.018em",
              }}
            >
              {item.title}
            </h3>
            <p className="text-fg-muted leading-relaxed text-base sm:text-lg">
              {item.description}
            </p>
            <div
              aria-hidden
              className="mt-8 h-px origin-left"
              style={{
                background:
                  "linear-gradient(90deg, var(--foreground) 0%, transparent 100%)",
                maxWidth: "14rem",
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile fallback: simple stacked list
 * ───────────────────────────────────────────────────────────────────────── */

function StackedProcess({ heading, items }: ProcessSectionProps) {
  return (
    <section className="pt-12 pb-24">
      <div className="container-custom">
        <div className="mb-12">
          <WordReveal
            text={heading}
            as="h2"
            className="font-semibold tracking-display text-fg leading-[1.05]"
            style={{
              fontSize: "clamp(2rem, 7vw, 3.25rem)",
              letterSpacing: "-0.02em",
            }}
          />
        </div>

        <div className="border-t border-[color:var(--rule)]">
          {items.map((item, i) => (
            <RevealOnScroll
              key={item.title}
              delay={i * 0.06}
              blur={false}
              y={24}
            >
              <article className="py-10 border-b border-[color:var(--rule)]">
                <div className="flex items-baseline gap-5 mb-4">
                  <span
                    aria-hidden
                    className="font-display text-fg-muted leading-none"
                    style={{
                      fontSize: "clamp(2.75rem, 14vw, 4.5rem)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mono-label text-fg-faint">
                    {item.eyebrow}
                  </span>
                </div>
                <h3
                  className="font-semibold tracking-display text-fg leading-[1.1] mb-4"
                  style={{ fontSize: "clamp(1.375rem, 5.5vw, 1.875rem)" }}
                >
                  {item.title}
                </h3>
                <p className="text-fg-muted leading-relaxed text-base">
                  {item.description}
                </p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

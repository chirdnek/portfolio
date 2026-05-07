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

export default function ProcessSection({ heading, items }: ProcessSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // A subtle vertical drift on the hairline cluster — gives the section a sense of tilt
  const railY = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);

  return (
    <section ref={sectionRef} className="relative pt-12 pb-32 sm:pt-20 sm:pb-44">
      <div className="container-custom">
        {/* Header — eyebrow over a massive headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-12 mb-16 sm:mb-24">
          <div className="lg:col-span-3">
            <RevealOnScroll blur={false}>
              <div className="mono-label text-fg-faint flex items-center gap-3">
                <span className="inline-block h-px w-10 bg-[color:var(--rule)]" />
                <span>How I work</span>
              </div>
            </RevealOnScroll>
          </div>

          <div className="lg:col-span-9">
            <WordReveal
              text={heading}
              as="h2"
              className="font-semibold tracking-display text-fg leading-[1.0]"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
                letterSpacing: "-0.025em",
              }}
            />
          </div>
        </div>

        {/* Steps — editorial rows with massive numerals */}
        <motion.div
          style={{ y: railY }}
          className="relative border-t border-[color:var(--rule)]"
        >
          {items.map((item, i) => (
            <ProcessRow key={item.title} item={item} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProcessRow({ item, index }: { item: ProcessItem; index: number }) {
  return (
    <RevealOnScroll delay={index * 0.06} blur={false} y={32}>
      <article className="group relative grid grid-cols-1 md:grid-cols-12 gap-y-5 md:gap-x-10 py-10 sm:py-14 lg:py-16 border-b border-[color:var(--rule)] transition-colors duration-500 hover:bg-[rgba(255,255,255,0.015)]">
        {/* Numeral — big, editorial, anchored on its baseline */}
        <div className="md:col-span-3 lg:col-span-4 flex items-start">
          <span
            aria-hidden
            className="font-display block leading-[0.85] text-fg-muted group-hover:text-fg transition-[color,letter-spacing] duration-500 group-hover:tracking-[-0.04em]"
            style={{
              fontSize: "clamp(4.5rem, 12vw, 9rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Content column */}
        <div className="md:col-span-9 lg:col-span-8 lg:max-w-2xl">
          <div className="mono-label text-fg-faint mb-3 flex items-center gap-2">
            <span>{item.eyebrow}</span>
          </div>
          <h3
            className="font-semibold tracking-display text-fg leading-[1.05] mb-5"
            style={{
              fontSize: "clamp(1.625rem, 3.4vw, 2.625rem)",
              letterSpacing: "-0.018em",
            }}
          >
            {item.title}
          </h3>
          <p className="text-fg-muted leading-relaxed text-base sm:text-lg">
            {item.description}
          </p>

          {/* Hover-revealed accent bar */}
          <div
            aria-hidden
            className="mt-7 h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out"
            style={{
              background:
                "linear-gradient(90deg, var(--foreground) 0%, transparent 100%)",
              maxWidth: "12rem",
            }}
          />
        </div>
      </article>
    </RevealOnScroll>
  );
}

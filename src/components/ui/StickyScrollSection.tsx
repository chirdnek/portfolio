"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface Item {
  eyebrow?: string;
  title: string;
  description: string;
}

interface StickyScrollSectionProps {
  heading: string;
  items: Item[];
  pinned: ReactNode;
}

export default function StickyScrollSection({
  heading,
  items,
  pinned,
}: StickyScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={ref} className="relative">
      <div className="container-custom">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-12 tracking-tight text-fg">
          {heading}
        </h2>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Pinned column */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <motion.div
                style={{
                  opacity: useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0.3, 1, 1, 0.4]),
                  background: "rgba(13,13,12,0.025)",
                  borderRadius: "2px",
                }}
                className="aspect-square w-full border border-[color:var(--border-strong)] overflow-hidden flex items-center justify-center"
              >
                {pinned}
              </motion.div>
            </div>
          </div>

          {/* Scrolling items */}
          <div className="lg:col-span-7 space-y-24 lg:py-12">
            {items.map((item, i) => (
              <Step key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ item, index }: { item: Item; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "start 30%"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.25, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [24, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y }} className="space-y-3">
      <div className="mono-label">
        {String(index + 1).padStart(2, "0")}
        {item.eyebrow ? ` — ${item.eyebrow}` : ""}
      </div>
      <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
        {item.title}
      </h3>
      <p className="text-fg-muted leading-relaxed text-base sm:text-lg max-w-xl">
        {item.description}
      </p>
    </motion.div>
  );
}

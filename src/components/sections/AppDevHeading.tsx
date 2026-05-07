"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * AppDevHeading — single-line 3D extruded title that bridges the
 * Process section and the Spline carousel.
 */
export default function AppDevHeading() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Subtle parallax — slab drifts as you scroll past it.
  const y = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 1], [10, 0, -4]);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{
        minHeight: "55svh",
        perspective: "1400px",
        background: "var(--background)",
      }}
      aria-label="Application developments"
    >
      <motion.div
        style={{ y, rotateX, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full px-4 sm:px-6 text-center select-none"
      >
        <h2
          className="font-display text-3d leading-[0.9] uppercase whitespace-nowrap"
          style={{
            fontSize: "clamp(1.75rem, 7.5vw, 7rem)",
            letterSpacing: "-0.025em",
          }}
        >
          Application Developments
        </h2>

        {/* Atmospheric bottom haze — sells the slab as a real surface */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: "-3rem",
            width: "55%",
            height: "4rem",
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />
      </motion.div>

      <style jsx>{`
        .text-3d {
          color: #f5f5f5;
          text-shadow:
            1px 1px 0 #d4d4d4,
            2px 2px 0 #b0b0b0,
            3px 3px 0 #8a8a8a,
            4px 4px 0 #5e5e5e,
            5px 5px 0 #3d3d3d,
            6px 6px 0 #262626,
            7px 7px 0 #181818,
            8px 8px 0 #0c0c0c,
            9px 9px 0 #060606,
            12px 14px 22px rgba(0, 0, 0, 0.65);
        }
      `}</style>
    </section>
  );
}

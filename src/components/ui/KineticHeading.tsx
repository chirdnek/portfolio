"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

/**
 * KineticHeading — word-by-word blur reveal.
 * Each word fades + de-blurs + rises into place with a tight stagger.
 */
export default function KineticHeading({
  text,
  delay = 0,
  className = "",
  style,
  as: As = "h1",
}: {
  text: string;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const words = text.split(" ");
  return (
    <As className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-block">
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.075,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block mr-[0.28em] last:mr-0"
          >
            {w}
          </motion.span>
        ))}
      </span>
    </As>
  );
}

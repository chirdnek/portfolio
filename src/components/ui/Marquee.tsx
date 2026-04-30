"use client";

import { motion } from "framer-motion";

interface MarqueeProps {
  items: string[];
  speed?: number; // seconds per loop
  className?: string;
  separator?: string;
}

export default function Marquee({
  items,
  speed = 32,
  className = "",
  separator = "✦",
}: MarqueeProps) {
  // Duplicate the list so the loop is seamless.
  const doubled = [...items, ...items];

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
      }}
    >
      <motion.div
        className="flex gap-12 whitespace-nowrap py-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 text-2xl sm:text-3xl font-medium tracking-tight text-fg-muted hover:text-fg transition-colors duration-300"
          >
            {item}
            <span aria-hidden className="text-accent text-base">
              {separator}
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

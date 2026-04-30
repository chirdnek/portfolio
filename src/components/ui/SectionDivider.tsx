"use client";

import { motion } from "framer-motion";

interface SectionDividerProps {
  index: string; // e.g. "01"
  label: string; // e.g. "Selected work"
  total?: string; // e.g. "04"
}

export default function SectionDivider({
  index,
  label,
  total,
}: SectionDividerProps) {
  return (
    <div className="container-custom">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 sm:gap-6 py-6"
      >
        <span className="mono-label text-fg shrink-0">
          {index}
          {total && <span className="text-fg-faint"> / {total}</span>}
        </span>

        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "left" }}
          className="block flex-1 h-px bg-[color:var(--border-strong)]"
        />

        <span className="mono-label text-fg shrink-0">{label}</span>
      </motion.div>
    </div>
  );
}

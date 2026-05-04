"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function RotatingWord({
  words,
  interval = 2200,
  className = "",
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [interval, words.length]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className={`relative inline-grid align-baseline ${className}`} style={{ gridTemplateColumns: "1fr" }}>
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {longest}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          initial={{ y: "0.55em", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-0.55em", opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="col-start-1 row-start-1 whitespace-nowrap text-accent"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

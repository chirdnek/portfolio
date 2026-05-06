"use client";

import { createElement, useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?+*<>/\\";

interface ScrambleTextProps {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function ScrambleText({
  text,
  duration = 1100,
  delay = 0,
  className = "",
  as = "span",
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplay(text);
      return;
    }

    let raf = 0;
    let start = 0;
    const total = text.length;

    const tick = (now: number) => {
      if (!start) start = now - delay;
      const elapsed = now - start;
      const progress = Math.max(0, Math.min(1, elapsed / duration));
      const settledCount = Math.floor(progress * total);

      let out = "";
      for (let i = 0; i < total; i++) {
        if (text[i] === " ") {
          out += " ";
        } else if (i < settledCount) {
          out += text[i];
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      setDisplay(out);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay]);

  // createElement sidesteps the strict JSX child-type narrowing that
  // happens when a polymorphic tag is typed as `keyof JSX.IntrinsicElements`.
  return createElement(as, { className }, display);
}

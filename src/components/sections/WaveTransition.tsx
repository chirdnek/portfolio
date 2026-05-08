"use client";

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const NUM_POINTS = 10;
const ANIM_DURATION = 1.5; // seconds — single upward rise, no return

/**
 * WaveTransition — port of the Blake Bowen / GSAP shape-overlays recipe.
 *
 * Plays automatically when the section enters the viewport. Two cubic-bezier
 * paths morph upward from the bottom of the viewport to the top, covering the
 * screen with the orange→pink gradient. There is **no return / no down phase**
 * — the wave only rises. Once covered, the wave stays in place until the user
 * scrolls past the section, at which point the SVG naturally exits upward
 * with normal page scroll.
 */
export default function WaveTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const [inView, setInView] = useState(false);

  // Stable per-point random offsets — give the wave its organic stagger.
  const pointDelays = useMemo(
    () => Array.from({ length: NUM_POINTS }, () => Math.random() * 0.06),
    [],
  );

  const path1D = useTransform(progress, (p) =>
    buildPathD(computePoints(p, 0, pointDelays)),
  );
  const path2D = useTransform(progress, (p) =>
    buildPathD(computePoints(p, 0.05, pointDelays)),
  );

  // Trigger when the section enters the viewport.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Play forward on enter; reset on exit so the next entry plays again.
  useEffect(() => {
    let controls: AnimationPlaybackControls | null = null;
    if (inView) {
      controls = animate(progress, 1, {
        duration: ANIM_DURATION,
        ease: [0.45, 0, 0.55, 1], // power2.inOut equivalent
      });
    } else {
      progress.set(0);
    }
    return () => {
      controls?.stop();
    };
  }, [inView, progress]);

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: "130vh", background: "var(--background)" }}
      aria-hidden
    >
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ background: "var(--background)" }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Front wave — soft peach → lavender pastel */}
            <linearGradient
              id="wave-grad-1"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ffc7a3" />
              <stop offset="50%" stopColor="#fbc6dc" />
              <stop offset="100%" stopColor="#d8c4f3" />
            </linearGradient>
            {/* Back wave — pale apricot → muted coral pastel */}
            <linearGradient
              id="wave-grad-2"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ffe7d2" />
              <stop offset="100%" stopColor="#fbb1a4" />
            </linearGradient>
          </defs>
          {/* Back wave first (drawn under), front wave on top */}
          <motion.path d={path2D} fill="url(#wave-grad-2)" />
          <motion.path d={path1D} fill="url(#wave-grad-1)" />
        </svg>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Single-direction (upward) animation. Each point's y-value drops from
 * 100 (bottom of viewBox = wave below the screen, nothing covered) to 0
 * (top of viewBox = wave at the top, screen fully covered). Per-point random
 * offsets stagger the descent so the crest reads as an organic wave.
 */
function computePoints(
  progress: number,
  pathDelay: number,
  pointDelays: number[],
): number[] {
  const t = clamp01((progress - pathDelay) / (1 - pathDelay));
  const points: number[] = [];
  for (let j = 0; j < NUM_POINTS; j++) {
    const localP = clamp01(t - pointDelays[j]);
    // y goes 100 → 0  (wave moves UP)
    const value = 100 - easeInOut(localP) * 100;
    points.push(value);
  }
  return points;
}

/**
 * Path with the **below-wave** area filled (closing edge is `V 100 H 0`).
 * As the wave rises (y → 0), the filled rectangle grows upward from the
 * bottom — covering the screen.
 */
function buildPathD(points: number[]): string {
  let d = `M 0 ${points[0]} C`;
  for (let j = 0; j < NUM_POINTS - 1; j++) {
    const p = ((j + 1) / (NUM_POINTS - 1)) * 100;
    const cp = p - ((1 / (NUM_POINTS - 1)) * 100) / 2;
    d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
  }
  d += " V 100 H 0";
  return d;
}

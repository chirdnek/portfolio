"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface EmberProps {
  count?: number;
}

export default function Embers({ count = 40 }: EmberProps) {
  // ⚠ All hooks MUST run on every render in the same order. The early-return
  // for the /world route used to come BEFORE useMemo — that violated the rules
  // of hooks when the user navigated between routes, surfacing as a Next.js
  // "Router action dispatched before initialization" error during transitions.
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setMounted(true); }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 20,
        duration: Math.random() * 25 + 15,
        hue: Math.random() > 0.5 ? "#FF5722" : "#FFC107",
        opacity: Math.random() * 0.4 + 0.25,
      })),
    [count]
  );

  // ── Conditional renders go AFTER all hook calls ───────────────────────
  if (!mounted) return null;
  // Skip on the immersive /world route — that scene has its own atmosphere
  // and the global ember layer competes with it visually.
  if (pathname?.startsWith("/world")) return null;

  return (
    <div
      aria-hidden
      data-suck
      data-testid="embers-layer"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            bottom: "-10vh",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: p.hue,
            boxShadow: `0 0 ${p.size * 3}px ${p.hue}`,
            ["--ember-op" as string]: p.opacity,
            animation: `float-ember ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
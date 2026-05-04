"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

export default function TiltCard({
  children,
  className = "",
  intensity = 8,
  style,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 180, damping: 20, mass: 0.5 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-intensity, intensity]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["20%", "80%"]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([x, y]) => `radial-gradient(420px circle at ${x} ${y}, rgba(255,255,255,0.18), transparent 55%)`
          ),
        }}
      />
    </motion.div>
  );
}

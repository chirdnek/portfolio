"use client";

import { useEffect, useRef } from "react";

export default function CursorSpotlight({
  size = 520,
  color = "rgba(77, 101, 255, 0.18)",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      target.current.x = e.clientX - r.left;
      target.current.y = e.clientY - r.top;
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * 0.18;
      current.current.y += dy * 0.18;
      el.style.transform = `translate3d(${current.current.x - size / 2}px, ${current.current.y - size / 2}px, 0)`;
      if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
        raf.current = requestAnimationFrame(tick);
      } else {
        raf.current = null;
      }
    };

    parent.addEventListener("pointermove", onMove);
    return () => {
      parent.removeEventListener("pointermove", onMove);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 z-[2] mix-blend-screen will-change-transform ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 60%)`,
        filter: "blur(8px)",
      }}
    />
  );
}

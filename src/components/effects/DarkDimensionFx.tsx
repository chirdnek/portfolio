"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient Dark Dimension FX layer:
 *  - Crimson/violet drifting particles on a canvas
 *  - Slow eldritch haze gradient overlay (CSS)
 *  - Grain/noise overlay (CSS)
 *  - Optional cursor sparks on pointer move
 *
 * Fixed-positioned, pointer-events: none. Behind all content (z: 0).
 */
export default function DarkDimensionFX() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = Math.min(
      90,
      Math.floor((width * height) / 28000)
    );

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      hue: number;
      a: number;
    };

    const particles: P[] = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25 - 0.05,
      r: Math.random() * 1.6 + 0.4,
      hue: Math.random() < 0.5 ? 340 : Math.random() < 0.5 ? 20 : 285,
      a: Math.random() * 0.6 + 0.2,
    }));

    const sparks: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
    }[] = [];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointer = (e: PointerEvent) => {
      if (Math.random() > 0.55) return;
      for (let i = 0; i < 2; i++) {
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 2.4,
          vy: (Math.random() - 0.5) * 2.4 - 0.4,
          life: 0,
          max: 40 + Math.random() * 30,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointer);

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Drifting dust
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grd.addColorStop(0, `hsla(${p.hue}, 90%, 60%, ${p.a})`);
        grd.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cursor sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.015;
        s.life++;
        const t = 1 - s.life / s.max;
        if (t <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `hsla(${15 + Math.random() * 20}, 100%, 60%, ${t})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.4 * t + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return (
    <div className="dd-fx" aria-hidden data-testid="dd-fx-layer">
      <div className="dd-fx__haze" />
      <div className="dd-fx__vignette" />
      <canvas ref={canvasRef} className="dd-fx__canvas" />
      <div className="dd-fx__grain" />
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/certifications", label: "Certs" },
  { href: "/blog", label: "Writing" },
];

// Dock magnification config (mirrors the GSAP recipe).
const MAGNET_RADIUS = 110;   // px from cursor where magnification starts
const MAGNET_MAX_SCALE = 1.32; // peak scale at the cursor
const MAGNET_LIFT = 14;       // px lifted upward at peak

export default function FloatingDock() {
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLElement[]>([]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const registerItem = useCallback((el: HTMLElement | null, index: number) => {
    if (el) {
      itemsRef.current[index] = el;
    }
  }, []);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const apply = (clientX: number) => {
      itemsRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = center - clientX;
        const abs = Math.abs(distance);

        let scale = 1;
        if (abs < MAGNET_RADIUS) {
          // Cosine falloff — same shape as GSAP snippet's
          // scale = 1 + (max/min - 1) * cos(rad)
          const rad = (distance / MAGNET_RADIUS) * (Math.PI / 2);
          scale = 1 + (MAGNET_MAX_SCALE - 1) * Math.cos(rad);
        }
        const y = -(scale - 1) * (MAGNET_LIFT / (MAGNET_MAX_SCALE - 1));
        el.style.transform = `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      });
    };

    const reset = () => {
      itemsRef.current.forEach((el) => {
        if (!el) return;
        el.style.transform = "translateY(0px) scale(1)";
      });
    };

    const onMove = (e: MouseEvent) => apply(e.clientX);

    dock.addEventListener("mousemove", onMove);
    dock.addEventListener("mouseleave", reset);

    return () => {
      dock.removeEventListener("mousemove", onMove);
      dock.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
      aria-label="Primary"
    >
      <div ref={dockRef} className="dock-glass relative flex items-end gap-0.5 px-1 py-1">
        {LINKS.map((l, i) => (
          <DockLink
            key={l.href}
            href={l.href}
            label={l.label}
            active={isActive(l.href)}
            registerRef={(el) => registerItem(el, i)}
          />
        ))}
        <Link
          href="/contact"
          ref={(el: HTMLAnchorElement | null) => registerItem(el, LINKS.length)}
          className="dock-magnet dock-cta ml-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono tracking-[0.16em] uppercase"
        >
          <span>Get in touch</span>
          <span aria-hidden>→</span>
        </Link>
      </div>

      <style jsx>{`
        .dock-glass {
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.12) 0%,
              rgba(255, 255, 255, 0.04) 100%
            );
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.30),
            inset 0 -1px 0 rgba(255, 255, 255, 0.06),
            0 0 0 1px rgba(0, 0, 0, 0.55),
            0 22px 60px -14px rgba(0, 0, 0, 0.85);
          isolation: isolate;
        }
        .dock-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.10) 0%,
            rgba(255, 255, 255, 0) 50%
          );
          border-radius: inherit;
          z-index: 0;
        }
        .dock-glass::after {
          content: "";
          position: absolute;
          left: 14%;
          right: 14%;
          bottom: -1px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.18) 50%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 0;
        }

        .dock-cta {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0.04) 100%
          );
          color: var(--foreground);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          backdrop-filter: blur(8px);
          transition:
            background 200ms ease,
            border-color 200ms ease,
            transform 300ms cubic-bezier(0, 0, 0.58, 1);
          position: relative;
          z-index: 1;
        }
        .dock-cta:hover {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.08) 100%
          );
          border-color: rgba(255, 255, 255, 0.28);
        }
      `}</style>

      {/* Global magnet styles — applied to every item the dock animates. */}
      <style jsx global>{`
        .dock-magnet {
          transform-origin: 50% 100%;
          transition: transform 0.3s cubic-bezier(0, 0, 0.58, 1);
          will-change: transform;
        }
      `}</style>
    </motion.nav>
  );
}

function DockLink({
  href,
  label,
  active,
  registerRef,
}: {
  href: string;
  label: string;
  active: boolean;
  registerRef: (el: HTMLAnchorElement | null) => void;
}) {
  return (
    <Link
      href={href}
      ref={registerRef}
      aria-current={active ? "page" : undefined}
      className={`dock-magnet relative inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-mono tracking-[0.16em] uppercase transition-colors duration-200 z-[1] ${
        active ? "text-fg" : "text-fg-muted hover:text-fg"
      }`}
      style={{ borderRadius: "9999px" }}
    >
      {active && (
        <motion.span
          layoutId="dock-active"
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.30) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            borderRadius: "9999px",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.4)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative">{label}</span>
    </Link>
  );
}

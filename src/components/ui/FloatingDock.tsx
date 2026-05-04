"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
];

export default function FloatingDock() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.nav
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
      aria-label="Primary"
    >
      <div
        className="flex items-center gap-1 border px-1.5 py-1.5 backdrop-blur-md"
        style={{
          background: "rgba(5, 5, 7, 0.82)",
          borderColor: "var(--border-strong)",
          borderRadius: "2px",
          boxShadow: "0 0 0 1px rgba(0,240,255,0.12), 0 14px 36px -12px rgba(0,0,0,0.7)",
        }}
      >
        {LINKS.map((l) => (
          <DockLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} />
        ))}
        <Link
          href="/contact"
          className="ml-1 inline-flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-[0.18em] uppercase transition-colors"
          style={{ background: "var(--accent)", color: "#000", borderRadius: "2px" }}
        >
          <span>Get in touch</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </motion.nav>
  );
}

function DockLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex items-center justify-center px-3.5 py-2 text-[11px] font-mono tracking-[0.16em] uppercase transition-colors duration-200 ${
        active ? "text-fg" : "text-fg-muted hover:text-fg"
      }`}
      style={{ borderRadius: "2px" }}
    >
      {active && (
        <motion.span
          layoutId="dock-active"
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "rgba(0, 240, 255, 0.10)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            borderRadius: "2px",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative">{label}</span>
    </Link>
  );
}

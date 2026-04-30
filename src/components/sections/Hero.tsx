"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ui/ScrambleText";
import MagneticButton from "@/components/ui/MagneticButton";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden">
      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at 30% 50%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 30% 50%, #000 30%, transparent 75%)",
        }}
      />

      {/* Soft accent bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "var(--accent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "var(--accent)" }}
      />

      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center gap-2"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="mono-label">Available for new work — 2026</span>
        </motion.div>

        <h1
          className="font-semibold tracking-display leading-[0.9] text-fg mb-10 max-w-5xl"
          style={{ fontSize: "clamp(3rem, 12vw, 9rem)" }}
        >
          <ScrambleText
            text="Building tools"
            duration={900}
            as="span"
            className="block"
          />
          <span className="block text-fg-muted">
            <ScrambleText text="people enjoy" duration={900} delay={500} />
            <span className="text-accent">.</span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-fg-muted leading-relaxed max-w-xl mb-12"
        >
          I&apos;m Kendrick — a full-stack developer in Zamboanga, Philippines.
          I design and ship refined, high-craft web experiences with React,
          TypeScript, and a quiet obsession with details.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-4"
        >
          <Link href="/projects">
            <MagneticButton className="btn-primary" type="button">
              See selected work
              <span aria-hidden>→</span>
            </MagneticButton>
          </Link>
          <Link href="/contact" className="link-underline text-sm">
            Or get in touch
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="absolute bottom-0 left-6 sm:left-8 lg:left-10 flex items-center gap-3"
        >
          <span className="mono-label">Scroll</span>
          <span aria-hidden className="relative block w-6 h-px bg-[color:var(--border-strong)] overflow-hidden">
            <span
              className="absolute inset-0 bg-[var(--accent)]"
              style={{ animation: "scroll-line 2.4s ease-in-out infinite" }}
            />
          </span>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes scroll-line {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}

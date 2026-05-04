"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import MagneticButton from "@/components/ui/MagneticButton";
import RotatingWord from "@/components/ui/RotatingWord";
import CursorSpotlight from "@/components/ui/CursorSpotlight";
import LocalTime from "@/components/ui/LocalTime";
import LogoMarquee from "@/components/ui/LogoMarquee";
import HeroCardHand from "@/components/ui/HeroCardHand";

const ROTATING = ["interfaces", "mobile apps", "design systems", "experiences"];

/** Visa-style countdown — fakes a "days remaining" HUD readout. */
function useVisaCountdown(targetDays = 7) {
  const [text, setText] = useState("00:00:00:00");
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const total = targetDays * 86400 - (elapsed % (targetDays * 86400));
      const d = Math.floor(total / 86400);
      const h = Math.floor((total % 86400) / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = Math.floor(total % 60);
      setText(
        `${String(d).padStart(2, "0")}:${String(h).padStart(2, "0")}:${String(
          m
        ).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetDays]);
  return text;
}

export default function Hero() {
  const visa = useVisaCountdown(7);

  return (
    <section className="relative min-h-[100svh] flex flex-col pt-6 sm:pt-8 pb-0 overflow-hidden">
      {/* Edge marginalia rules */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 sm:left-8 lg:left-10 w-px bg-[color:var(--rule)] opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-6 sm:right-8 lg:right-10 w-px bg-[color:var(--rule)] opacity-40" />

      {/* Faint dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          color: "rgba(232,232,234,0.10)",
          maskImage: "radial-gradient(ellipse at 50% 35%, #000 22%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 35%, #000 22%, transparent 72%)",
        }}
      />

      {/* Cursor wash — accent red, low opacity */}
      <CursorSpotlight size={520} color="rgba(255, 0, 60, 0.10)" />

      {/* CRT scanlines & vignette over everything */}
      <div className="scanlines pointer-events-none absolute inset-0 z-[3]" aria-hidden />
      <div className="crt-vignette pointer-events-none absolute inset-0 z-[3]" aria-hidden />

      <div className="container-custom relative z-10 flex-1 flex flex-col">
        {/* HUD masthead — visa countdown + status */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-between gap-y-2 mb-8 sm:mb-10"
        >
          <div className="flex items-center gap-3 sm:gap-5 mono-label">
            <span className="flex items-center gap-2 text-[color:var(--accent)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full bg-[color:var(--accent)] opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 bg-[color:var(--accent)]" />
              </span>
              <span>Game · Live</span>
            </span>
            <span aria-hidden className="hidden sm:inline-block h-px w-6 bg-[color:var(--rule)]" />
            <span className="text-[color:var(--hud)]">
              VISA <span className="font-mono">{visa}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 mono-label">
            <LocalTime />
            <span aria-hidden className="hidden sm:inline-block h-px w-6 bg-[color:var(--rule)]" />
            <span>Player.001 — KS</span>
          </div>
        </motion.div>

        {/* Suit rule under masthead */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="suit-rule mb-10 sm:mb-12"
          aria-hidden
        >
          <span className="text-base">♠ ♥ ♦ ♣</span>
        </motion.div>

        {/* Headline + side card */}
        <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-start flex-1">
          {/* Headline column */}
          <div className="col-span-12 lg:col-span-8">
            <h1
              className="font-display text-fg block uppercase leading-[0.86] tracking-[-0.01em]"
              style={{ fontSize: "clamp(3rem, 11.5vw, 9.5rem)" }}
            >
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="block glitch glitch--always"
                data-text="DESIGN OR DIE"
              >
                DESIGN OR DIE
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden
                className="block"
              >
                <span style={{ color: "var(--hud)" }}>build </span>
                <RotatingWord words={[...ROTATING]} />
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 max-w-2xl text-base sm:text-lg text-fg-muted leading-relaxed"
            >
              I&apos;m Kendrick — a UI/UX designer and web/mobile
              developer based in Tugbungan, Zamboanga City. I design in
              Figma and ship in Flutter and React. Every project is a
              game with rules; the win condition is craft.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <Link href="/projects">
                <MagneticButton className="btn-primary" type="button">
                  Enter the arena
                  <span aria-hidden>→</span>
                </MagneticButton>
              </Link>
              <Link href="/contact" className="btn-ghost">
                Make contact
              </Link>
              <span aria-hidden className="hidden sm:inline-block h-px w-6 bg-[color:var(--rule)]" />
              <a
                href="/CV/CV.pdf"
                download="Kendrick-Serrano-CV.pdf"
                className="mono-label text-fg-muted hover:text-fg transition-colors"
              >
                Download CV ↓
              </a>
            </motion.div>
          </div>

          {/* Right column: glass player panel only */}
          <div className="col-span-12 lg:col-span-4">
            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="player-card relative overflow-hidden p-6"
            >
            {/* HUD corner accents (cyan) */}
            <span aria-hidden className="player-card__corner player-card__corner--tl" />
            <span aria-hidden className="player-card__corner player-card__corner--br" />

            <div className="relative z-[1]">
              <div className="flex items-center justify-between">
                <span className="mono-label text-[color:var(--hud)]">Player Card</span>
                <span aria-hidden className="suit-pip text-[color:var(--accent)] text-lg">♥</span>
              </div>

              <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="space-y-4">
                <Row label="Designing" value="FishFresh (capstone)" />
                <Row label="Studying" value="BS IT, WMSU" />
                <Row label="Tools" value="Figma · Flutter · Code" />
                <Row label="Status" value="Available" highlight />
              </div>

              <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <a
                href="mailto:kendrickserrano7@gmail.com"
                className="group flex items-center justify-between text-sm text-fg-muted transition-colors hover:text-fg"
              >
                <span className="font-mono text-xs">kendrickserrano7@gmail.com</span>
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center border text-xs transition-all group-hover:bg-[color:var(--accent)] group-hover:text-black group-hover:border-[color:var(--accent)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 backdrop-blur-sm"
                  style={{ borderColor: "rgba(255,255,255,0.30)", borderRadius: "2px" }}
                >
                  ↗
                </span>
              </a>
            </div>

            <style jsx>{`
              .player-card {
                /* Solid-feeling frosted slab — opaque enough that
                   the cursor wash behind it can't visibly shift. */
                background:
                  linear-gradient(
                    135deg,
                    rgba(20, 20, 24, 0.78) 0%,
                    rgba(10, 10, 14, 0.86) 100%
                  );
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.16);
                backdrop-filter: blur(28px) saturate(120%);
                -webkit-backdrop-filter: blur(28px) saturate(120%);
                box-shadow:
                  inset 0 1px 0 rgba(255, 255, 255, 0.18),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.04),
                  0 24px 60px -24px rgba(0, 0, 0, 0.85),
                  0 0 0 1px rgba(0, 240, 255, 0.08);
                isolation: isolate;
                will-change: auto;
                transform: translateZ(0);
              }
              /* Glass top sheen — fixed, doesn't react to mouse */
              .player-card::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(
                  180deg,
                  rgba(255, 255, 255, 0.08) 0%,
                  rgba(255, 255, 255, 0) 32%
                );
                z-index: 0;
              }
              .player-card__corner {
                position: absolute;
                width: 14px;
                height: 14px;
                border: 1px solid var(--hud);
                opacity: 0.75;
                pointer-events: none;
                z-index: 2;
              }
              .player-card__corner--tl {
                top: -1px; left: -1px;
                border-width: 1px 0 0 1px;
              }
              .player-card__corner--br {
                bottom: -1px; right: -1px;
                border-width: 0 1px 1px 0;
              }
            `}</style>
            </motion.aside>
          </div>
        </div>

        {/* Bottom: marquee inside hairlines */}
        <div className="mt-14 sm:mt-20 -mx-6 sm:-mx-8 lg:-mx-10">
          <div className="h-px bg-[color:var(--rule)]" />
          <LogoMarquee speed={42} />
          <div className="h-px bg-[color:var(--rule)]" />
        </div>
      </div>

      {/* Decorative random-card hand — bottom-right of hero, above the marquee */}
      <HeroCardHand />
    </section>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="mono-label text-fg-faint">{label}</span>
      <span className={`text-sm font-mono ${highlight ? "text-[color:var(--accent)]" : "text-fg"}`}>
        {value}
      </span>
    </div>
  );
}

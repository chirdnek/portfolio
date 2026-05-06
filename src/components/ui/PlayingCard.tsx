"use client";

import { motion } from "framer-motion";
import { useState, type CSSProperties } from "react";

type Suit = "♠" | "♥" | "♦" | "♣";

interface PlayingCardProps {
  suit: Suit;
  rank: string;
  label: string;
  value: string;
  index?: number;
  /** Initial face. Defaults to back; user clicks to flip. */
  defaultFlipped?: boolean;
  /** Optional rotation in degrees, for fanned hand layouts */
  rotate?: number;
  /** Smaller card variant for compact stacks */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

const SUIT_COLOR: Record<Suit, string> = {
  "♠": "var(--foreground)",
  "♣": "var(--foreground)",
  "♥": "var(--accent)",
  "♦": "var(--accent)",
};

export default function PlayingCard({
  suit,
  rank,
  label,
  value,
  index = 0,
  defaultFlipped = false,
  rotate = 0,
  compact = false,
  className = "",
  style,
}: PlayingCardProps) {
  const [flipped, setFlipped] = useState(defaultFlipped);
  const color = SUIT_COLOR[suit];

  // compact = roughly 60% of standard playing-card size
  const cornerFontSize = compact ? "1.05rem" : "1.6rem";
  const valueFontSize = compact
    ? "clamp(0.95rem, 1.5vw, 1.25rem)"
    : "clamp(1.4rem, 2.4vw, 2rem)";
  const padding = compact ? "p-3" : "p-5";

  return (
    <motion.button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-label={`${rank} of ${suitName(suit)} — click to flip`}
      aria-pressed={flipped}
      // Cards must be visible from SSR — entry animates motion only,
      // never opacity (avoids "stuck at 0" if hydration is delayed).
      initial={{ y: 14, rotate: rotate - 4 }}
      animate={{ y: 0, rotate }}
      transition={{
        duration: 0.7,
        delay: 0.15 + index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, rotate, scale: 1.04 }}
      style={{
        perspective: 1200,
        transformOrigin: "center bottom",
        ...style,
      }}
      className={`playing-card-flipper relative aspect-[3/4] block cursor-pointer ${className}`}
    >
      <div
        className="playing-card-inner relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* BACK (shown first) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            border: "2px solid #00f0ff",
            borderRadius: "6px",
            background: "linear-gradient(160deg, #2a2a35 0%, #15151c 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(0,0,0,0.4), 0 18px 32px -10px rgba(0,0,0,0.9), 0 0 36px -6px rgba(0,240,255,0.45)",
          }}
        >
          <CardBack suit={suit} compact={compact} />
        </div>

        {/* FRONT (revealed on click — pre-rotated 180°) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: "2px solid #e85070",
            borderRadius: "6px",
            background: "linear-gradient(160deg, #2c2c38 0%, #161620 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(0,0,0,0.4), 0 18px 32px -10px rgba(0,0,0,0.9), 0 0 36px -6px rgba(232,80,112,0.45)",
          }}
        >
          {/* Holo shimmer on the front when revealed */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background:
                "linear-gradient(135deg, rgba(232,80,112,0.14) 0%, rgba(0,240,255,0.14) 35%, rgba(255,212,0,0.12) 60%, rgba(232,80,112,0.14) 100%)",
              backgroundSize: "220% 220%",
              backgroundPosition: "100% 0",
              animation: "card-foil 3.4s ease-in-out infinite",
              opacity: 0.85,
            }}
          />

          {/* Crosshatch texture */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, var(--foreground) 0 1px, transparent 1px 6px), repeating-linear-gradient(45deg, var(--foreground) 0 1px, transparent 1px 6px)",
            }}
          />

          {/* Top-left corner */}
          <div
            className={`absolute leading-none flex flex-col items-center gap-0.5 select-none ${
              compact ? "top-2 left-2" : "top-3 left-3 sm:top-4 sm:left-4"
            }`}
          >
            <span
              className="font-display tracking-tight"
              style={{ color, fontSize: cornerFontSize, lineHeight: 0.9 }}
            >
              {rank}
            </span>
            <span
              className="suit-pip"
              style={{ color, fontSize: cornerFontSize, lineHeight: 1 }}
            >
              {suit}
            </span>
          </div>

          {/* Bottom-right corner, rotated */}
          <div
            className={`absolute leading-none flex flex-col items-center gap-0.5 select-none ${
              compact ? "bottom-2 right-2" : "bottom-3 right-3 sm:bottom-4 sm:right-4"
            }`}
            style={{ transform: "rotate(180deg)" }}
          >
            <span
              className="font-display tracking-tight"
              style={{ color, fontSize: cornerFontSize, lineHeight: 0.9 }}
            >
              {rank}
            </span>
            <span
              className="suit-pip"
              style={{ color, fontSize: cornerFontSize, lineHeight: 1 }}
            >
              {suit}
            </span>
          </div>

          {/* Center face */}
          <div className={`relative z-[1] h-full flex flex-col items-center justify-center text-center ${padding}`}>
            <span className={`mono-label text-fg-faint ${compact ? "text-[9px]" : ""} mb-1.5`}>
              — {label} —
            </span>
            <span
              className="font-display uppercase text-fg leading-none"
              style={{ fontSize: valueFontSize, letterSpacing: "-0.01em" }}
            >
              {value}
            </span>
            <span
              aria-hidden
              className={`mt-2 block h-px ${compact ? "w-6" : "w-10"}`}
              style={{ background: color }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes card-foil {
          0%, 100% { background-position: 100% 0; }
          50%      { background-position: 0 100%; }
        }
      `}</style>
    </motion.button>
  );
}

function suitName(suit: Suit): string {
  return suit === "♠"
    ? "spades"
    : suit === "♥"
    ? "hearts"
    : suit === "♦"
    ? "diamonds"
    : "clubs";
}

/** AiB-themed card back: dark field + cyan argyle + central monogram. */
function CardBack({ suit, compact }: { suit: Suit; compact: boolean }) {
  return (
    <div className="relative w-full h-full">
      {/* Argyle / diamond grid background — bumped to be visible */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(0,240,255,0.32) 25%, transparent 25%, transparent 75%, rgba(0,240,255,0.32) 75%), linear-gradient(45deg, rgba(0,240,255,0.32) 25%, transparent 25%, transparent 75%, rgba(0,240,255,0.32) 75%)",
          backgroundSize: compact ? "10px 10px" : "14px 14px",
          backgroundPosition: "0 0, 5px 5px",
        }}
      />

      {/* Crimson hairline border inside */}
      <span
        aria-hidden
        className="absolute inset-1.5 border"
        style={{ borderColor: "rgba(232,80,112,0.75)", borderRadius: "2px" }}
      />

      {/* Crosshair guides */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px opacity-60"
        style={{ background: "var(--hud)" }}
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px opacity-60"
        style={{ background: "var(--hud)" }}
      />

      {/* Central medallion */}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className="suit-pip flex items-center justify-center"
          style={{
            color: "var(--accent)",
            fontSize: compact ? "1.6rem" : "2.4rem",
            lineHeight: 1,
            width: compact ? "2.4rem" : "3.4rem",
            height: compact ? "2.4rem" : "3.4rem",
            background: "#0a0a0e",
            border: "1.5px solid var(--hud)",
            borderRadius: "999px",
            boxShadow: "0 0 0 4px #0a0a0e, 0 0 24px -2px rgba(232,80,112,0.55)",
          }}
        >
          {suit}
        </span>
      </span>

      {/* Tap-to-reveal hint */}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-2 mono-label text-center text-[color:var(--hud)] opacity-90 ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        TAP TO REVEAL
      </span>

      {/* CRT scanline overlay on back */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.30) 0 1px, transparent 1px 3px)",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

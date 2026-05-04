"use client";

import { useRef, type ReactNode } from "react";

export type BentoSpan = "1x1" | "2x1" | "1x2" | "2x2";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
type Suit = (typeof SUITS)[number];

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(220px,auto)] gap-3 ${className}`}
      style={{ gridAutoFlow: "dense" }}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  span?: BentoSpan;
  href?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  tags?: string[];
  image?: string;
  className?: string;
  index?: number;
}

const SPAN_CLASS: Record<BentoSpan, string> = {
  "1x1": "",
  "2x1": "lg:col-span-2",
  "1x2": "lg:row-span-2",
  "2x2": "lg:col-span-2 lg:row-span-2",
};

export function BentoCard({
  span = "1x1",
  href,
  eyebrow,
  title,
  description,
  tags,
  image,
  className = "",
  index,
}: BentoCardProps) {
  const ref = useRef<HTMLAnchorElement | HTMLDivElement>(null);

  const isWide = span === "2x2" || span === "2x1";
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href
    ? {
        href,
        target: href.startsWith("http") ? "_blank" : undefined,
        rel: href.startsWith("http") ? "noopener noreferrer" : undefined,
      }
    : {};

  // Map index to a card suit so each tile feels like a different "game"
  const suit: Suit = SUITS[(index ?? 0) % SUITS.length];
  const suitColor =
    suit === "♥" || suit === "♦" ? "var(--accent)" : "var(--foreground)";
  const cardValue = String((index ?? 0) + 1).padStart(2, "0");

  return (
    <Wrapper
      // @ts-expect-error — ref union for Wrapper
      ref={ref}
      {...wrapperProps}
      aria-label={title}
      className={`bento-card group relative flex flex-col justify-between overflow-hidden transition-all duration-300
        border border-[color:var(--border-strong)] bg-elev hover:border-[color:var(--accent)]
        ${SPAN_CLASS[span]} ${className}`}
      style={{ borderRadius: "2px" }}
    >
      {/* ── REST STATE: just the image ─────────────────────────────── */}

      {/* Background image — fills the card, full opacity, soft scale on hover */}
      {image && (
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 1,
          }}
        />
      )}

      {/* ── HOVER STATE: everything below fades in on hover ──────── */}

      {/* HUD corner brackets */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-t border-l opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ borderColor: "var(--hud)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b border-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ borderColor: "var(--hud)" }}
      />

      {/* Dark wash so the text is readable when revealed */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,7,0.55) 0%, rgba(5,5,7,0.78) 50%, rgba(5,5,7,0.92) 100%)",
        }}
      />

      {/* Top row: card value + suit + arrow — fade-in */}
      <div className="relative z-10 flex items-start justify-between p-5 pb-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col leading-none gap-1">
          <span
            className="suit-pip text-2xl"
            style={{ color: suitColor, lineHeight: 1 }}
          >
            {suit}
          </span>
          <span className="font-mono text-[11px] tracking-widest text-fg-faint">{cardValue}</span>
          {eyebrow && (
            <span className="mt-2 mono-label" style={{ color: "var(--hud)" }}>
              {eyebrow}
            </span>
          )}
        </div>
        {href && (
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center border border-[color:var(--border-strong)] text-fg-muted text-xs
              transition-all duration-300
              group-hover:border-[color:var(--accent)]
              group-hover:bg-[color:var(--accent)]
              group-hover:text-black
              group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ borderRadius: "2px" }}
          >
            ↗
          </span>
        )}
      </div>

      {/* Content — title + desc + tags — fade-in + slight rise */}
      <div className="relative z-10 mt-auto p-5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-300 ease-out">
        <h3
          className={`font-display uppercase tracking-tight text-fg ${
            isWide ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
          }`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`mt-2 text-fg-muted leading-relaxed ${
              isWide ? "text-base max-w-xl line-clamp-3" : "text-sm line-clamp-2"
            }`}
          >
            {description}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.slice(0, isWide ? 4 : 3).map((t) => (
              <span
                key={t}
                className="text-[10px] tracking-[0.18em] uppercase text-fg-muted px-2 py-0.5 border font-mono"
                style={{
                  background: "rgba(0, 240, 255, 0.04)",
                  borderColor: "var(--border-strong)",
                  borderRadius: "1px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Bottom-right inverted suit pip */}
        <span
          aria-hidden
          className="absolute bottom-3 right-4 suit-pip text-base"
          style={{ color: suitColor, transform: "rotate(180deg)" }}
        >
          {suit}
        </span>
      </div>
    </Wrapper>
  );
}

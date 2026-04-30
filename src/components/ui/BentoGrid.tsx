"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

export type BentoSpan = "1x1" | "2x1" | "1x2" | "2x2";

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

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const isWide = span === "2x2" || span === "2x1";
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href
    ? {
        href,
        target: href.startsWith("http") ? "_blank" : undefined,
        rel: href.startsWith("http") ? "noopener noreferrer" : undefined,
      }
    : {};

  return (
    <Wrapper
      // @ts-expect-error — ref union for Wrapper
      ref={ref}
      onMouseMove={handleMove}
      {...wrapperProps}
      className={`bento-card group relative flex flex-col justify-between overflow-hidden rounded-xl transition-all duration-500
        border border-subtle bg-white/[0.012] hover:border-[color:rgba(77,101,255,0.55)]
        ${SPAN_CLASS[span]} ${className}`}
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
    >
      {/* Cursor-tracked radial highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgba(77,101,255,0.12), transparent 50%)",
        }}
      />

      {/* Background image with mask */}
      {image && (
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isWide ? 0.32 : 0.22,
            maskImage:
              "linear-gradient(180deg, transparent 0%, #000 35%, #000 100%)",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, #000 35%, #000 100%)",
          }}
        />
      )}

      {/* Subtle dark vignette over image at bottom */}
      {image && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, rgba(10,10,10,0.55) 75%, rgba(10,10,10,0.85) 100%)",
          }}
        />
      )}

      {/* Top row: eyebrow + arrow */}
      <div className="relative z-10 flex items-start justify-between p-6 pb-0">
        <div className="flex items-center gap-2">
          {typeof index === "number" && (
            <span className="text-[10px] tracking-wider text-fg-faint font-mono">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {eyebrow && <span className="mono-label">{eyebrow}</span>}
        </div>
        {href && (
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full border border-subtle text-fg-muted text-xs
              transition-all duration-300
              group-hover:border-[color:rgba(77,101,255,0.6)]
              group-hover:text-accent
              group-hover:bg-[color:rgba(77,101,255,0.08)]
              group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            ↗
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-auto p-6">
        <h3
          className={`font-semibold tracking-tight text-fg ${
            isWide ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
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
                className="text-[10px] tracking-wider uppercase text-fg-muted px-2 py-0.5 rounded border border-subtle bg-white/[0.02] backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

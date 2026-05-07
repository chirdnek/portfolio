"use client";

import { useEffect, useState } from "react";

export interface StackItem {
  name: string;
  /** simple-icons slug. Used to pull a CDN logo (white-tinted). Optional — falls back to a dot. */
  slug?: string;
  /** Short qualifier shown after the name, e.g. "cross-platform UI". */
  note?: string;
}

export interface SplineApp {
  url: string;
  name: string;
  /** One-line description shown under the name (kept optional for the centered title block). */
  blurb?: string;
  /** Small label above the name (e.g. "Capstone · 2025"). Currently not rendered. */
  eyebrow?: string;
  /** Long-form description shown in the left side panel. */
  description?: string;
  /** Tech stack list shown in the left side panel. */
  stack?: StackItem[];
}

interface SplineCarouselProps {
  apps: SplineApp[];
}

const TRANSITION_MS = 360;
const TITLE_INTRO_DELAY_MS = 600;

/**
 * SplineCarousel — full-screen showcase that crossfades between Spline scenes.
 *
 * Performance notes:
 *   - All iframes are mounted once and kept warm; only opacity changes.
 *   - We never animate transform on the iframe (would force WebGL repaints).
 *   - Active iframe alone receives pointer events.
 */
export default function SplineCarousel({ apps }: SplineCarouselProps) {
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);
  // Indices currently allowed to be visible. Inactive ones get visibility:hidden
  // so the browser throttles their rAF loops; the active scene keeps the GPU.
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setTitleVisible(true), TITLE_INTRO_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const handleIframeLoad = (url: string) => {
    setLoadedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const goTo = (newIdx: number) => {
    if (locked) return;
    const target = ((newIdx % apps.length) + apps.length) % apps.length;
    if (target === idx) return;

    setLocked(true);
    setTitleVisible(false);
    // Reveal the target first so the crossfade has both layers visible.
    setVisibleIndices((prev) => {
      const next = new Set(prev);
      next.add(target);
      return next;
    });

    requestAnimationFrame(() => {
      setIdx(target);
      setTimeout(() => {
        // Hide everything except the new active iframe to throttle their rAFs.
        setVisibleIndices(new Set([target]));
        setLocked(false);
        setTitleVisible(true);
      }, TRANSITION_MS);
    });
  };

  const next = () => goTo(idx + 1);
  const prev = () => goTo(idx - 1);

  const current = apps[idx];

  if (!mounted) {
    return <div suppressHydrationWarning className="absolute inset-0" />;
  }

  const currentLoaded = loadedUrls.has(current.url);

  return (
    <div
      className="absolute inset-0"
      style={{
        background: "var(--background)",
        contain: "layout paint",
        isolation: "isolate",
      }}
    >
      {/* All iframes mounted once, kept warm. Inactive ones use visibility:hidden
          so the browser throttles their rAF loop — the active scene gets full GPU. */}
      {apps.map((app, i) => {
        const active = i === idx;
        const loaded = loadedUrls.has(app.url);
        const visible = active && loaded;
        return (
          <iframe
            key={app.url}
            src={app.url}
            title={app.name}
            loading={i === 0 ? "eager" : "lazy"}
            allow="autoplay; fullscreen; xr-spatial-tracking; clipboard-read; clipboard-write"
            onLoad={() => handleIframeLoad(app.url)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
              background: "var(--background)",
              opacity: visible ? 1 : 0,
              visibility: visibleIndices.has(i) ? "visible" : "hidden",
              transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              willChange: active ? "opacity" : "auto",
              pointerEvents: visible ? "auto" : "none",
              zIndex: active ? 2 : 1,
              transform: "translateZ(0)",
            }}
          />
        );
      })}

      {/* Initial loader veil — only covers until the first scene paints */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{
          background: "var(--background)",
          opacity: currentLoaded ? 0 : 1,
          transition: "opacity 320ms ease",
          zIndex: 4,
        }}
      >
        <span
          className="mono-label text-fg-faint"
          style={{
            opacity: currentLoaded ? 0 : 1,
            transition: "opacity 220ms ease",
          }}
        >
          Loading scene…
        </span>
      </div>

      {/* ── LEFT: Project info (description + tech stack), exposed inline ── */}
      {(current.description || (current.stack && current.stack.length > 0)) && (
        <aside
          key={`panel-${idx}`}
          className="hidden md:flex absolute z-20 flex-col gap-6"
          style={{
            left: "clamp(1.25rem, 3vw, 2.75rem)",
            top: "clamp(11rem, 26vh, 16rem)",
            width: "min(26rem, 34vw)",
          }}
        >
          {current.description && (
            <div className="space-y-3">
              <span
                className="mono-label text-fg-faint splash-word"
                style={{ animationDelay: "120ms" }}
              >
                Overview
              </span>
              <p className="text-sm sm:text-[15px] leading-relaxed text-fg-muted">
                {current.description.split(/\s+/).map((word, i) => (
                  <span
                    key={`${idx}-w-${i}`}
                    className="splash-word"
                    style={{ animationDelay: `${220 + i * 40}ms` }}
                  >
                    {word}
                    {" "}
                  </span>
                ))}
              </p>
            </div>
          )}

          {current.stack && current.stack.length > 0 && (
            <div className="space-y-3">
              <span
                className="mono-label text-fg-faint splash-word"
                style={{
                  animationDelay: `${
                    260 + (current.description?.split(/\s+/).length ?? 0) * 40
                  }ms`,
                }}
              >
                Tech Stack
              </span>
              <ul className="space-y-1">
                {current.stack.map((s, i) => (
                  <li
                    key={`${idx}-s-${s.name}`}
                    className="stack-row"
                    style={{
                      animationDelay: `${
                        320 +
                        (current.description?.split(/\s+/).length ?? 0) * 40 +
                        i * 80
                      }ms`,
                    }}
                  >
                    <span className="stack-icon" aria-hidden>
                      {s.slug ? (
                        <img
                          src={`https://cdn.simpleicons.org/${s.slug}/ffffff`}
                          alt=""
                          width={14}
                          height={14}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="stack-dot" />
                      )}
                    </span>
                    <span className="stack-name">{s.name}</span>
                    {s.note && <span className="stack-note">{s.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}

      {/* ── TOP: Title (delayed reveal, key forces re-trigger on idx change) ── */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 text-center w-[min(94vw,920px)] px-4"
        style={{ top: "clamp(3rem, 8vh, 5.5rem)" }}
      >
        <div
          key={idx}
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible
              ? "translateY(0)"
              : "translateY(10px)",
            transition:
              "opacity 480ms cubic-bezier(0.16,1,0.3,1), transform 480ms cubic-bezier(0.16,1,0.3,1)",
            willChange: "opacity, transform",
          }}
        >
          <h3
            className="font-display uppercase tracking-tight text-fg leading-[0.95]"
            style={{ fontSize: "clamp(2.4rem, 7.5vw, 5.25rem)", letterSpacing: "-0.015em" }}
          >
            {current.name}
          </h3>
          {current.blurb && (
            <p className="mt-4 text-sm sm:text-base text-fg-muted max-w-xl mx-auto">
              {current.blurb}
            </p>
          )}
        </div>
      </div>

      {/* ── BOTTOM-RIGHT: Stacked Next + Prev buttons (also covers the Spline watermark) ── */}
      <div
        className="absolute z-20 flex flex-col gap-1.5 p-1.5"
        style={{
          bottom: "12px",
          right: "12px",
          width: "164px",
          background: "var(--background)",
          borderRadius: "14px",
        }}
      >
        <button
          type="button"
          onClick={next}
          aria-label="Next app"
          className="carousel-btn carousel-btn--block"
          disabled={locked}
        >
          <span>Next</span>
          <span aria-hidden>→</span>
        </button>
        <button
          type="button"
          onClick={prev}
          aria-label="Previous app"
          className="carousel-btn carousel-btn--block"
          disabled={locked}
        >
          <span aria-hidden>←</span>
          <span>Prev</span>
        </button>
      </div>

      {/* ── BOTTOM: Progress bar (full width, very bottom of section) ── */}
      <div
        className="absolute z-10 left-0 right-0 px-6 sm:px-10"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
      >
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <span className="mono-label text-fg-faint shrink-0 tabular-nums">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 flex items-center gap-1.5">
            {apps.map((_, i) => (
              <div
                key={i}
                className="flex-1 relative overflow-hidden"
                style={{
                  height: "2px",
                  background: "rgba(255,255,255,0.14)",
                  borderRadius: "2px",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    transform: i <= idx ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform 480ms cubic-bezier(0.16,1,0.3,1)",
                    willChange: "transform",
                  }}
                />
              </div>
            ))}
          </div>
          <span className="mono-label text-fg-faint shrink-0 tabular-nums">
            {String(apps.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <style jsx>{`
        .splash-word {
          display: inline-block;
          opacity: 0;
          filter: blur(10px);
          transform: translateY(8px);
          animation: splashIn 1100ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, filter, transform;
        }

        .stack-row {
          display: grid;
          grid-template-columns: 22px auto 1fr;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.55rem;
          margin-left: -0.55rem;
          margin-right: -0.55rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
          line-height: 1.2;
          opacity: 0;
          filter: blur(8px);
          transform: translateY(6px);
          animation: splashRow 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition:
            background-color 220ms ease,
            color 220ms ease,
            transform 220ms ease,
            filter 220ms ease;
        }
        .stack-row:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.98);
          transform: translateX(2px);
        }
        .stack-icon {
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .stack-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.55);
          display: block;
        }
        .stack-name {
          font-weight: 500;
          letter-spacing: 0.005em;
        }
        .stack-note {
          color: rgba(255, 255, 255, 0.42);
          font-size: 12px;
          font-family: var(--font-mono), ui-monospace, monospace;
          letter-spacing: 0.04em;
          justify-self: end;
          text-align: right;
        }

        @keyframes splashIn {
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        @keyframes splashRow {
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        .carousel-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1rem;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(20, 20, 22, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 8px 24px -10px rgba(0, 0, 0, 0.7);
          cursor: pointer;
          transition:
            background 180ms ease,
            border-color 180ms ease,
            transform 180ms ease,
            opacity 180ms ease;
          will-change: transform;
        }
        .carousel-btn--block {
          width: 100%;
          justify-content: center;
        }
        .carousel-btn:hover:not(:disabled) {
          background: rgba(32, 32, 36, 0.96);
          border-color: rgba(255, 255, 255, 0.30);
          transform: translateY(-1px);
        }
        .carousel-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .carousel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

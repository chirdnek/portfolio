"use client";

import { BRAND_ICONS } from "./BrandIcons";

/**
 * LogoMarquee — infinite horizontal scroller of brand logos.
 *
 * Uses a pure CSS keyframe animation (translateX 0 → -50% on a doubled
 * track) so it works regardless of framer-motion / smooth-scroll state.
 */
export default function LogoMarquee({
  speed = 38,
  className = "",
}: {
  speed?: number;
  className?: string;
}) {
  const doubled = [...BRAND_ICONS, ...BRAND_ICONS];

  return (
    <div
      className={`logo-marquee relative w-full overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
      }}
    >
      <div
        className="logo-marquee__track flex items-center gap-12 sm:gap-16 whitespace-nowrap py-7 w-max"
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map(({ id, label, Icon }, i) => (
          <span
            key={`${id}-${i}`}
            title={label}
            aria-label={label}
            aria-hidden={i >= BRAND_ICONS.length}
            className="group inline-flex items-center gap-3 text-fg-muted transition-colors duration-300 hover:text-fg shrink-0"
          >
            <Icon size={26} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="mono-label tracking-wider text-fg-faint group-hover:text-fg-muted transition-colors">
              {label}
            </span>
          </span>
        ))}
      </div>

      <style jsx>{`
        .logo-marquee__track {
          animation-name: logo-marquee-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .logo-marquee:hover .logo-marquee__track {
          animation-play-state: paused;
        }
        @keyframes logo-marquee-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-marquee__track { animation: none; }
        }
      `}</style>
    </div>
  );
}

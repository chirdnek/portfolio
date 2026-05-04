"use client";

/**
 * RainbowPrism — animated spectrum aurora band.
 *
 * Layered SVG paths (back / mid / front beam) with screen blending and
 * independent sway timings, plus drifting bokeh dots for depth. The path
 * morphs between two waveforms, the hue rotates, and the highlight beam
 * pulses — so it never reads as static even on first paint.
 */
export default function RainbowPrism({
  className = "",
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      className={`prism-root pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      style={{ ["--prism-i" as string]: intensity }}
    >
      <div className="prism-floor absolute inset-0" />

      {/* Back layer — broad, soft aurora */}
      <svg className="prism-svg prism-svg--back" viewBox="0 0 1600 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="prism-grad-back" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2d55" />
            <stop offset="18%" stopColor="#ff8a00" />
            <stop offset="35%" stopColor="#ffd84d" />
            <stop offset="55%" stopColor="#3ddc84" />
            <stop offset="75%" stopColor="#4d9bff" />
            <stop offset="92%" stopColor="#a55cff" />
            <stop offset="100%" stopColor="#ff2d55" />
          </linearGradient>
          <filter id="prism-blur-back" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="48" />
          </filter>
        </defs>
        <path
          className="prism-path prism-path--back"
          fill="url(#prism-grad-back)"
          filter="url(#prism-blur-back)"
        >
          <animate
            attributeName="d"
            dur="14s"
            repeatCount="indefinite"
            values="
              M -100,500 C 300,260 600,760 900,480 S 1500,260 1800,500 L 1800,900 L -100,900 Z;
              M -100,520 C 300,720 600,260 900,560 S 1500,740 1800,500 L 1800,900 L -100,900 Z;
              M -100,500 C 300,260 600,760 900,480 S 1500,260 1800,500 L 1800,900 L -100,900 Z
            "
          />
        </path>
      </svg>

      {/* Mid layer — sharper, more saturated */}
      <svg className="prism-svg prism-svg--mid" viewBox="0 0 1600 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="prism-grad-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3070" />
            <stop offset="22%" stopColor="#ff9933" />
            <stop offset="42%" stopColor="#ffe066" />
            <stop offset="58%" stopColor="#5be3a0" />
            <stop offset="78%" stopColor="#5ca8ff" />
            <stop offset="100%" stopColor="#b974ff" />
          </linearGradient>
          <filter id="prism-blur-mid" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <path
          className="prism-path prism-path--mid"
          fill="url(#prism-grad-mid)"
          filter="url(#prism-blur-mid)"
        >
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M -100,520 C 280,340 620,720 920,500 S 1480,360 1800,520 L 1800,900 L -100,900 Z;
              M -100,540 C 280,700 620,340 920,580 S 1480,720 1800,500 L 1800,900 L -100,900 Z;
              M -100,520 C 280,340 620,720 920,500 S 1480,360 1800,520 L 1800,900 L -100,900 Z
            "
          />
        </path>
      </svg>

      {/* Front beam — thin, bright "light" stroke */}
      <svg className="prism-svg prism-svg--front" viewBox="0 0 1600 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="prism-grad-front" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="15%" stopColor="#ffd0d0" stopOpacity="1" />
            <stop offset="35%" stopColor="#fff5b0" stopOpacity="1" />
            <stop offset="55%" stopColor="#b0ffd0" stopOpacity="1" />
            <stop offset="78%" stopColor="#b0d0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="prism-blur-front" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <path
          className="prism-path prism-path--front"
          fill="none"
          stroke="url(#prism-grad-front)"
          strokeWidth="2.4"
          filter="url(#prism-blur-front)"
        >
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M -100,540 C 280,380 620,680 920,520 S 1480,380 1800,540;
              M -100,560 C 280,720 620,360 920,600 S 1480,720 1800,520;
              M -100,540 C 280,380 620,680 920,520 S 1480,380 1800,540
            "
          />
        </path>
      </svg>

      {/* Floating bokeh dots — slow drifting depth */}
      <div className="prism-bokeh">
        <span style={{ left: "12%", top: "62%", animationDelay: "-2s" }} />
        <span style={{ left: "28%", top: "70%", animationDelay: "-7s" }} />
        <span style={{ left: "44%", top: "55%", animationDelay: "-4s" }} />
        <span style={{ left: "63%", top: "68%", animationDelay: "-9s" }} />
        <span style={{ left: "78%", top: "60%", animationDelay: "-1s" }} />
        <span style={{ left: "90%", top: "72%", animationDelay: "-5s" }} />
      </div>

      <style jsx>{`
        .prism-root { isolation: isolate; }
        .prism-floor {
          background: radial-gradient(ellipse at 50% 75%, transparent 0%, rgba(10,10,10,0.4) 60%, #0a0a0a 100%);
          z-index: 1;
        }
        .prism-svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          mix-blend-mode: screen;
          will-change: transform, filter;
        }
        .prism-svg--back {
          z-index: 2;
          opacity: calc(0.65 * var(--prism-i));
          animation: prism-sway-slow 20s ease-in-out infinite;
        }
        .prism-svg--mid {
          z-index: 3;
          opacity: calc(0.95 * var(--prism-i));
          animation: prism-sway-fast 13s ease-in-out infinite reverse;
        }
        .prism-svg--front {
          z-index: 4;
          opacity: calc(1 * var(--prism-i));
          animation: prism-sway-fast 9s ease-in-out infinite, prism-pulse 4.5s ease-in-out infinite;
        }
        .prism-path {
          transform-origin: 50% 60%;
          animation: prism-hue 22s linear infinite;
          will-change: filter;
        }

        .prism-bokeh { position: absolute; inset: 0; z-index: 5; mix-blend-mode: screen; }
        .prism-bokeh span {
          position: absolute;
          width: 6px; height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.85);
          filter: blur(2px);
          opacity: 0;
          animation: prism-bokeh 12s ease-in-out infinite;
        }

        @keyframes prism-sway-slow {
          0%, 100% { transform: translate3d(-2%, 1%, 0) scale(1.05); }
          50%      { transform: translate3d(2%, -1%, 0) scale(1.02); }
        }
        @keyframes prism-sway-fast {
          0%, 100% { transform: translate3d(1%, 0, 0) scale(1.02); }
          50%      { transform: translate3d(-2%, -2%, 0) scale(1.07); }
        }
        @keyframes prism-hue {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes prism-pulse {
          0%, 100% { opacity: calc(0.6 * var(--prism-i)); }
          50%      { opacity: calc(1 * var(--prism-i)); }
        }
        @keyframes prism-bokeh {
          0%   { opacity: 0; transform: translate3d(0, 0, 0) scale(0.8); }
          50%  { opacity: 0.7; transform: translate3d(20px, -30px, 0) scale(1.1); }
          100% { opacity: 0; transform: translate3d(40px, -60px, 0) scale(0.9); }
        }

        @media (prefers-reduced-motion: reduce) {
          .prism-svg, .prism-path, .prism-bokeh span { animation: none !important; }
          .prism-svg animate { display: none; }
        }
      `}</style>
    </div>
  );
}

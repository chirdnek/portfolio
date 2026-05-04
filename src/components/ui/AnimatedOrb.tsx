"use client";

/**
 * AnimatedOrb — single slow-drifting accent gradient orb.
 *
 * Replaces the busy multi-layer prism with a single, restrained
 * radial bloom that drifts on a long path. Reads as ambient light,
 * not as decoration.
 */
export default function AnimatedOrb({
  className = "",
  size = 720,
  color = "rgba(77, 101, 255, 0.42)",
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <span
        className="orb"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 60%)`,
        }}
      />
      <span
        className="orb orb--alt"
        style={{
          width: size * 0.65,
          height: size * 0.65,
          background: `radial-gradient(circle, rgba(255, 90, 160, 0.22) 0%, rgba(0,0,0,0) 60%)`,
        }}
      />

      <style jsx>{`
        .orb {
          position: absolute;
          left: 50%;
          top: 55%;
          border-radius: 9999px;
          filter: blur(40px);
          mix-blend-mode: screen;
          will-change: transform;
          animation: orb-drift 22s ease-in-out infinite;
          transform: translate(-50%, -50%);
        }
        .orb--alt {
          animation: orb-drift-alt 28s ease-in-out infinite;
          opacity: 0.85;
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(-58%, -52%) scale(1); }
          25%      { transform: translate(-32%, -64%) scale(1.08); }
          50%      { transform: translate(-66%, -38%) scale(0.96); }
          75%      { transform: translate(-44%, -58%) scale(1.04); }
        }
        @keyframes orb-drift-alt {
          0%, 100% { transform: translate(-30%, -40%) scale(1); }
          33%      { transform: translate(-72%, -50%) scale(1.06); }
          66%      { transform: translate(-50%, -28%) scale(0.94); }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb { animation: none; }
        }
      `}</style>
    </div>
  );
}

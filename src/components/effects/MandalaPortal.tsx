"use client";

import { motion } from "framer-motion";

type Props = {
  size?: number;
  spinDuration?: number;
  reverse?: boolean;
  className?: string;
};

/**
 * Sling-ring / Eye-of-Agamotto style mandala portal.
 * Pure SVG, Framer Motion powered. Three concentric rings
 * rotate at different speeds for an eldritch, shifting feel.
 */
export default function MandalaPortal({
  size = 480,
  spinDuration = 80,
  reverse = false,
  className,
}: Props) {
  const dir = reverse ? -360 : 360;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dd-portal-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff2d7d" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#8b0033" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0b000a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dd-rune-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7a2d" />
          <stop offset="50%" stopColor="#ff2d7d" />
          <stop offset="100%" stopColor="#6b1f8f" />
        </linearGradient>
      </defs>

      {/* Glow base */}
      <circle cx="200" cy="200" r="195" fill="url(#dd-portal-glow)" />

      {/* Outer ring — slow */}
      <motion.g
        animate={{ rotate: dir }}
        transition={{ duration: spinDuration, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "200px 200px" }}
      >
        <circle
          cx="200"
          cy="200"
          r="190"
          fill="none"
          stroke="url(#dd-rune-stroke)"
          strokeWidth="1.2"
          strokeDasharray="2 8"
        />
        <circle
          cx="200"
          cy="200"
          r="178"
          fill="none"
          stroke="#ff2d7d"
          strokeWidth="0.6"
          strokeOpacity="0.5"
        />
        {/* Runic tick marks */}
        {Array.from({ length: 48 }).map((_, i) => {
          const angle = (i / 48) * Math.PI * 2;
          const x1 = 200 + Math.cos(angle) * 170;
          const y1 = 200 + Math.sin(angle) * 170;
          const x2 = 200 + Math.cos(angle) * (i % 4 === 0 ? 158 : 164);
          const y2 = 200 + Math.sin(angle) * (i % 4 === 0 ? 158 : 164);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ff6a00"
              strokeOpacity={i % 4 === 0 ? 0.9 : 0.4}
              strokeWidth={i % 4 === 0 ? 1.2 : 0.6}
            />
          );
        })}
      </motion.g>

      {/* Middle ring — medium, counter direction */}
      <motion.g
        animate={{ rotate: -dir }}
        transition={{
          duration: spinDuration * 0.65,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ transformOrigin: "200px 200px" }}
      >
        <circle
          cx="200"
          cy="200"
          r="140"
          fill="none"
          stroke="url(#dd-rune-stroke)"
          strokeWidth="0.8"
          strokeDasharray="10 4 2 4"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const cx = 200 + Math.cos(angle) * 140;
          const cy = 200 + Math.sin(angle) * 140;
          return (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <polygon
                points="0,-6 6,0 0,6 -6,0"
                fill="none"
                stroke="#ff2d7d"
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </motion.g>

      {/* Inner ring — fastest */}
      <motion.g
        animate={{ rotate: dir }}
        transition={{
          duration: spinDuration * 0.4,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ transformOrigin: "200px 200px" }}
      >
        <circle
          cx="200"
          cy="200"
          r="100"
          fill="none"
          stroke="#ff6a00"
          strokeWidth="0.7"
          strokeOpacity="0.7"
        />
        <circle
          cx="200"
          cy="200"
          r="86"
          fill="none"
          stroke="#ff2d7d"
          strokeWidth="0.5"
          strokeOpacity="0.4"
          strokeDasharray="3 3"
        />
        {/* Triangular sigil inside */}
        <polygon
          points="200,130 260,230 140,230"
          fill="none"
          stroke="url(#dd-rune-stroke)"
          strokeWidth="1"
        />
        <polygon
          points="200,230 260,130 140,130"
          fill="none"
          stroke="url(#dd-rune-stroke)"
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="200" cy="200" r="18" fill="none" stroke="#ff6a00" strokeWidth="1" />
        <circle cx="200" cy="200" r="4" fill="#ff2d7d" />
      </motion.g>
    </motion.svg>
  );
}

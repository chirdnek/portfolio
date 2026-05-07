"use client";

import {
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
  type HTMLMotionProps,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

type MagneticButtonProps = HTMLMotionProps<"button"> & {
  children: ReactNode;
  /** Multiplier on the cursor offset. 0.35 ≈ subtle, 0.6 = clingy. */
  strength?: number;
  /** Padding (px) around the button that defines the magnet activation zone. */
  zonePadding?: number;
};

/**
 * MagneticButton — pull-toward-cursor effect ported from the GSAP recipe:
 *
 *   mousemove on zone:
 *     mapRange cursor → [-w/2, w/2], animate btn x/y by * strength
 *     duration 0.4s, ease power2.out, overwrite true
 *
 *   mouseleave on zone:
 *     animate btn back to 0,0 with elastic.out(1, 0.4)
 *
 * Power2.out ≈ cubic-bezier(0, 0, 0.58, 1).
 * Elastic.out is approximated with a Framer Motion spring (low damping, slight bounce).
 */
export default function MagneticButton({
  children,
  strength = 0.35,
  zonePadding = 18,
  className = "",
  ...rest
}: MagneticButtonProps) {
  const zoneRef = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const animsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    const stopAnims = () => {
      animsRef.current.forEach((a) => a.stop());
      animsRef.current = [];
    };

    const onMove = (e: MouseEvent) => {
      const rect = zone.getBoundingClientRect();
      const mx = mapRange(
        rect.left,
        rect.right,
        -rect.width / 2,
        rect.width / 2,
        e.clientX,
      );
      const my = mapRange(
        rect.top,
        rect.bottom,
        -rect.height / 2,
        rect.height / 2,
        e.clientY,
      );
      stopAnims();
      animsRef.current.push(
        animate(x, mx * strength, {
          duration: 0.4,
          ease: [0, 0, 0.58, 1], // power2.out
        }),
        animate(y, my * strength, {
          duration: 0.4,
          ease: [0, 0, 0.58, 1],
        }),
      );
    };

    const onLeave = () => {
      stopAnims();
      animsRef.current.push(
        animate(x, 0, {
          type: "spring",
          stiffness: 90,
          damping: 7,
          mass: 0.9,
          restDelta: 0.0001,
        }),
        animate(y, 0, {
          type: "spring",
          stiffness: 90,
          damping: 7,
          mass: 0.9,
          restDelta: 0.0001,
        }),
      );
    };

    zone.addEventListener("mousemove", onMove);
    zone.addEventListener("mouseleave", onLeave);
    return () => {
      zone.removeEventListener("mousemove", onMove);
      zone.removeEventListener("mouseleave", onLeave);
      stopAnims();
    };
  }, [strength, x, y]);

  return (
    <span
      ref={zoneRef}
      className="inline-flex"
      style={{ padding: zonePadding }}
    >
      <motion.button
        style={{ x, y }}
        className={className}
        {...rest}
      >
        {children}
      </motion.button>
    </span>
  );
}

function mapRange(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  value: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

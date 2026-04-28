"use client";

interface PageScaleTransitionProps {
  children: React.ReactNode;
}

// GSAP removed. Children render at full size with no scale-in animation.
export default function PageScaleTransition({ children }: PageScaleTransitionProps) {
  return <>{children}</>;
}

"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Check if device is touch device
    const isTouchDevice = () => {
      return (
        (typeof window !== "undefined" &&
          ("ontouchstart" in window ||
            (navigator && "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0))) ||
        false
      );
    };

    // Hide cursor on touch devices
    if (isTouchDevice()) {
      cursor.style.display = "none";
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isAnimating = true;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Smooth lerp animation loop
    const animate = () => {
      if (!isAnimating) return;

      const ease = 0.4;
      currentX += (mouseX - currentX) * ease;
      currentY += (mouseY - currentY) * ease;

      cursor.style.left = currentX + "px";
      cursor.style.top = currentY + "px";

      requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      cursor.style.opacity = "1";
    };

    // Scale up on clickable elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        window.getComputedStyle(target).cursor === "pointer";

      if (isClickable) {
        cursor.style.transform = "translate(-50%, -50%) scale(2.5)";
      }
    };

    const handleMouseOut = () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    requestAnimationFrame(animate);

    return () => {
      isAnimating = false;
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-[9999] rounded-full hidden md:block"
      style={{
        width: "20px",
        height: "20px",
        backgroundColor: "white",
        mixBlendMode: "difference",
        transform: "translate(-50%, -50%)",
        transition: "opacity 0.2s ease",
        opacity: 1,
      }}
    />
  );
}
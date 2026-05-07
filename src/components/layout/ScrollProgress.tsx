"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollProgress = windowHeight > 0 ? scrolled / windowHeight : 0;
      setProgress(scrollProgress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide on the /world route — that page lands fullscreen after the portal transit.
  if (pathname?.startsWith("/world")) return null;

  return (
    <div
      data-suck
      className="fixed top-2 left-2 right-2 z-[9998] overflow-hidden"
      style={{
        height: "2px",
        background: "rgba(255, 255, 255, 0.10)",
        borderRadius: "2px",
      }}
    >
      <div
        aria-hidden
        className="h-full origin-left"
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          transform: `scaleX(${progress})`,
          transition: "transform 80ms linear",
          willChange: "transform",
        }}
      />
    </div>
  );
}

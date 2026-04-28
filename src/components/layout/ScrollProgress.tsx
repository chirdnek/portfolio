"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const segments = 180; // Number of vertical stick lines

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollProgress = windowHeight > 0 ? (scrolled / windowHeight) * 100 : 0;
      setProgress(scrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide on the /world route — that page lands fullscreen after the portal transit.
  if (pathname?.startsWith("/world")) return null;

  const filledSegments = Math.ceil((progress / 100) * segments);

  return (
    <div
      data-suck
      className="fixed top-2 left-0 right-0 h-4 z-[9998] flex items-center justify-self-center gap-1 px-1 py-1"
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 h-3.5 transition-all duration-75"
          style={{
            backgroundColor: i < filledSegments ? "rgba(255, 106, 0, 0.95)" : "rgba(255, 255, 255, 0.15)",
            boxShadow: i < filledSegments ? "0 0 6px rgba(255, 120, 0, 0.65)" : "none",
          }}
        />
      ))}
    </div>
  );
}

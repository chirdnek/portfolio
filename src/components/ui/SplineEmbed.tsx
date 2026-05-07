"use client";

import { useEffect, useState } from "react";

interface SplineEmbedProps {
  /** Spline share URL — e.g. https://my.spline.design/<scene-slug>/ */
  url: string;
  /** CSS height value. Defaults to a responsive cap. */
  height?: string;
  className?: string;
  title?: string;
}

/**
 * Iframe-based Spline embed. Mount-gated so SSR and the client first
 * paint match (avoids hydration noise from third-party iframes).
 */
export default function SplineEmbed({
  url,
  height = "min(72vh, 640px)",
  className = "",
  title = "Spline 3D scene",
}: SplineEmbedProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      suppressHydrationWarning
      className={`relative w-full overflow-hidden rounded-xl border border-[color:var(--border-strong)] ${className}`}
      style={{ height, background: "rgba(13,13,12,0.04)" }}
    >
      {mounted ? (
        <iframe
          src={url}
          title={title}
          loading="lazy"
          allow="autoplay; fullscreen; xr-spatial-tracking; clipboard-read; clipboard-write"
          style={{
            border: "none",
            width: "100%",
            height: "100%",
            display: "block",
            background: "transparent",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="w-full h-full grid place-items-center mono-label text-fg-faint"
        >
          Loading 3D scene…
        </div>
      )}
    </div>
  );
}

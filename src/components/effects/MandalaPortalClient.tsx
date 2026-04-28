"use client";

import dynamic from "next/dynamic";

// Client-only wrapper around MandalaPortal.
//
// MandalaPortal's SVG tick marks are computed from Math.sin/Math.cos, which
// produce last-digit floating-point drift between the Node SSR runtime and
// the browser (e.g. 78.75644347017861 vs ...862) — React flags that as a
// hydration mismatch. Disabling SSR for this component eliminates the
// mismatch without touching MandalaPortal itself.
const MandalaPortal = dynamic(() => import("./MandalaPortal"), {
  ssr: false,
});

export default MandalaPortal;

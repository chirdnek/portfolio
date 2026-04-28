"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Project = {
  title: string;
  role: string;
  description: string;
  image: string;
  year: string;
  liveUrl: string;
  stack: string[];
  branch: string;
  buildTime: string;
  language: string;
  fileName: string;
  fileExt: string;
};

const projects: Project[] = [
  {
    title: "Disaster Response",
    role: "FRONTEND LEAD & UI ARCHITECT",
    description:
      "Real-time emergency coordination platform connecting first responders with civilians during natural disasters across the Zamboanga peninsula.",
    image: "/images/projects/Screenshot 2024-09-12 131056.png",
    year: "2024",
    liveUrl: "#",
    stack: ["React", "Firebase", "Tailwind", "Mapbox"],
    branch: "main",
    buildTime: "1.2s",
    language: "TypeScript React",
    fileName: "DisasterResponse",
    fileExt: "tsx",
  },
  {
    title: "VocabVoyage",
    role: "MOBILE DEVELOPER",
    description:
      "A gamified language-learning app turning daily commutes into vocabulary expeditions with spaced-repetition cards.",
    image: "/images/projects/Screenshot 2024-10-18 230025.png",
    year: "2024",
    liveUrl: "#",
    stack: ["React Native", "Expo", "SQLite"],
    branch: "main",
    buildTime: "0.9s",
    language: "TypeScript",
    fileName: "VocabVoyage",
    fileExt: "tsx",
  },
  {
    title: "Cooking Book",
    role: "FULL-STACK ENGINEER",
    description:
      "Editorial recipe vault with rich filtering, ingredient scaling, and a clean print mode for the kitchen.",
    image: "/images/projects/Screenshot 2024-10-29 175143.png",
    year: "2024",
    liveUrl: "#",
    stack: ["Next.js", "MongoDB", "Tailwind"],
    branch: "main",
    buildTime: "1.4s",
    language: "TypeScript React",
    fileName: "CookingBook",
    fileExt: "tsx",
  },
  {
    title: "Pentaxite",
    role: "PRODUCT DESIGNER",
    description:
      "End-to-end identity and product system for a creative-services studio — visual language, components, and a marketing site.",
    image: "/images/projects/Screenshot 2025-01-23 174939.png",
    year: "2025",
    liveUrl: "#",
    stack: ["Figma", "Framer", "Notion"],
    branch: "design/v2",
    buildTime: "0.6s",
    language: "Design Tokens",
    fileName: "Pentaxite",
    fileExt: "fig",
  },
  {
    title: "Saas Catering",
    role: "FULL-STACK ENGINEER",
    description:
      "Multi-tenant catering platform — booking, menu builder, payment splits, and an admin dashboard for venue partners.",
    image: "/images/projects/Screenshot 2025-02-07 095800.png",
    year: "2025",
    liveUrl: "#",
    stack: ["Next.js", "Supabase", "Stripe", "Tailwind"],
    branch: "main",
    buildTime: "1.8s",
    language: "TypeScript React",
    fileName: "SaasCatering",
    fileExt: "tsx",
  },
  {
    title: "The Eilish Vault",
    role: "FRONTEND DEVELOPER",
    description:
      "A fan-built archive site — discography, lyrics, and editorial moodboards stitched together with reverent typography.",
    image: "/images/projects/Screenshot 2025-04-16 112218.png",
    year: "2025",
    liveUrl: "#",
    stack: ["React", "GSAP", "Tailwind"],
    branch: "main",
    buildTime: "0.7s",
    language: "JavaScript React",
    fileName: "EilishVault",
    fileExt: "jsx",
  },
  {
    title: "Coffee Blog",
    role: "FRONTEND DEVELOPER",
    description:
      "A slow-reading editorial blog about specialty coffee — origin stories, brew guides, and quiet typography.",
    image: "/images/projects/Screenshot 2025-04-16 121617.png",
    year: "2025",
    liveUrl: "#",
    stack: ["Next.js", "MDX", "Tailwind"],
    branch: "main",
    buildTime: "0.8s",
    language: "MDX",
    fileName: "CoffeeBlog",
    fileExt: "mdx",
  },
  {
    title: "Figma Design",
    role: "PRODUCT DESIGNER",
    description:
      "Selected interface explorations — dashboards, marketing pages, and component libraries shipped as production-ready Figma kits.",
    image: "/images/projects/Screenshot 2025-07-03 184020.png",
    year: "2025",
    liveUrl: "#",
    stack: ["Figma", "Variables", "Auto-Layout"],
    branch: "design/main",
    buildTime: "0.5s",
    language: "Figma",
    fileName: "FigmaDesign",
    fileExt: "fig",
  },
];

const extColor: Record<string, string> = {
  tsx: "#3178c6",
  ts: "#3178c6",
  jsx: "#f7df1e",
  js: "#f7df1e",
  json: "#cbcb41",
  md: "#519aba",
  mdx: "#519aba",
  sql: "#dad8d8",
  fig: "#a259ff",
};

/* ─── Icons ─── */
const Icon = {
  vscode: (
    <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M75 6 L24 46 L10 38 L4 44 V56 L10 62 L24 54 L75 94 L96 84 V16 Z M75 30 V70 L48 50 Z"
        fill="#0078D4"
      />
    </svg>
  ),
  winMin: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M2 6h8" />
    </svg>
  ),
  winMax: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="2.5" y="2.5" width="7" height="7" />
    </svg>
  ),
  winClose: (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  ),
  arrowL: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m15 6-6 6 6 6" />
    </svg>
  ),
  arrowR: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  files: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  git: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="12" r="2.2" />
      <path d="M6 8.2v7.6M8.2 6c5 0 7.6 2.6 7.6 6" />
    </svg>
  ),
  debug: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="11" r="4.5" />
      <path d="M12 6.5V4M9 4l3-1 3 1M5.5 11H3M21 11h-2.5M7.5 14l-2.5 2M16.5 14l2.5 2M12 15.5V20" />
    </svg>
  ),
  ext: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
      <path d="M13.5 3.5h4a3 3 0 0 1 3 3v4M3.5 13.5v4a3 3 0 0 0 3 3h4" />
    </svg>
  ),
  beaker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3h6v6l5 11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1l5-11z" />
    </svg>
  ),
  account: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
  gear: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  ),
  chevron: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  folder: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#dcb67a">
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  branchSm: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M6 8v8M8 6c4 0 8 2 8 6" />
    </svg>
  ),
  err: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16v.5" />
    </svg>
  ),
  warn: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 2 21h20z" />
      <path d="M12 10v5M12 18v.5" />
    </svg>
  ),
  external: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 4h6v6M10 14 20 4M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
    </svg>
  ),
  back: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  fwd: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  searchSm: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  // ─── Doctor Strange flourishes ───
  agamotto: (
    <svg width="13" height="13" viewBox="0 0 24 24" className="agamotto-spin" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="rgba(255,150,40,0.55)" strokeWidth="0.6" strokeDasharray="2 3" />
      <circle cx="12" cy="12" r="7.5"  fill="none" stroke="rgba(255,200,80,0.55)" strokeWidth="0.5" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.6" fill="none" stroke="rgba(255,100,20,0.7)" strokeWidth="0.6" />
      <ellipse cx="12" cy="12" rx="3.6" ry="9.5" fill="none" stroke="rgba(255,100,20,0.45)" strokeWidth="0.45" />
      <circle cx="12" cy="12" r="1.6" fill="rgba(255,200,80,0.9)" />
    </svg>
  ),
};

/* ─── Backdrop mandala (rotates slowly behind the VS Code window) ───
   Tick coords are precomputed and rounded so SSR and client emit identical
   strings (Math.cos/sin trailing-digit drift caused hydration mismatch). */
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const MANDALA_TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2;
  const r1 = 490;
  const r2 = i % 5 === 0 ? 470 : 480;
  return {
    x1: r4(550 + r1 * Math.cos(a)),
    y1: r4(550 + r1 * Math.sin(a)),
    x2: r4(550 + r2 * Math.cos(a)),
    y2: r4(550 + r2 * Math.sin(a)),
    heavy: i % 10 === 0,
  };
});

function MandalaBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Warm radial halo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(255,80,0,0.10) 0%, rgba(120,30,0,0.05) 35%, transparent 70%)",
        }}
      />
      {/* Outer ring — slow CW */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg className="mandala-spin" width="1100" height="1100" viewBox="0 0 1100 1100">
          <circle cx="550" cy="550" r="500" fill="none" stroke="rgba(255,130,40,0.15)" strokeWidth="1" strokeDasharray="3 9" />
          {MANDALA_TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="rgba(255,160,60,0.28)"
              strokeWidth={t.heavy ? 1.4 : 0.7}
            />
          ))}
          <circle cx="550" cy="550" r="430" fill="none" stroke="rgba(255,160,60,0.10)" strokeWidth="0.8" strokeDasharray="2 6" />
        </svg>
      </div>
      {/* Inner runic ring — counter-rotating */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg className="mandala-spin-rev" width="760" height="760" viewBox="0 0 760 760" style={{ overflow: "visible" }}>
          <defs>
            <path id="mw-runes" d="M380,380 m-330,0 a330,330 0 1,1 660,0 a330,330 0 1,1 -660,0" />
          </defs>
          <circle cx="380" cy="380" r="350" fill="none" stroke="rgba(255,100,20,0.10)" strokeWidth="0.6" />
          <text
            style={{ fontFamily: "serif", fontSize: 13, letterSpacing: "0.22em", fill: "rgba(255,170,60,0.28)" }}
          >
            <textPath href="#mw-runes" startOffset="0%">
              ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ · VINTAZK · ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉ ·
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  );
}

const ActivityBtn = ({
  active = false,
  badge,
  children,
}: {
  active?: boolean;
  badge?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`relative flex items-center justify-center w-full h-12 cursor-default ${
      active
        ? "text-white border-l-2 border-white"
        : "text-white/45 border-l-2 border-transparent hover:text-white/85"
    }`}
  >
    {children}
    {badge && (
      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-mono font-semibold bg-[#0078d4] text-white rounded-full">
        {badge}
      </span>
    )}
  </div>
);

const MENU = ["File", "Edit", "Selection", "View", "Go", "Run", "..."];

export default function MyWork() {
  const [active, setActive] = useState(0);
  const [tabs, setTabs] = useState<number[]>([0]);
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);

  const open = useCallback((i: number) => {
    setActive(i);
    setTabs((prev) => (prev.includes(i) ? prev : [...prev, i].slice(-4)));
  }, []);

  const closeTab = useCallback(
    (tabIdx: number) => {
      setTabs((prev) => {
        const filtered = prev.filter((t) => t !== tabIdx);
        // If we closed the active tab, jump to a neighbor (the one now at the same position).
        if (tabIdx === active && filtered.length > 0) {
          const pos = prev.indexOf(tabIdx);
          setActive(filtered[Math.min(pos, filtered.length - 1)]);
        }
        return filtered;
      });
    },
    [active]
  );

  const next = useCallback(
    () => open((active + 1) % projects.length),
    [active, open]
  );
  const prev = useCallback(
    () => open((active - 1 + projects.length) % projects.length),
    [active, open]
  );

  // Keyboard arrows when the window is in focus or hovered
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!editorRef.current) return;
      const rect = editorRef.current.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
      if (!inView) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  // Mouse drag (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) > 80) {
      if (dx < 0) next();
      else prev();
    }
  };

  const p = projects[active];

  return (
    <section id="work" className="relative bg-black overflow-clip">
      {/* Section header */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pt-8 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#ff6a00] tracking-wider">003</span>
            <span className="w-12 h-px bg-[#ff6a00]/40" />
            <span className="text-xs uppercase tracking-[0.28em] text-[#ff6a00] flex items-center gap-2">
              <span>Sanctum · Selected Work</span>
              <span className="text-[#ff6a00]/60" aria-hidden>{Icon.agamotto}</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40 tracking-[0.22em] hidden sm:inline">
            ← DRAG · ⌨ ARROW KEYS · 📁 CLICK FILE →
          </span>
        </div>
      </div>

      {/* The big VS Code window — wrapped in mystical backdrop */}
      <div className="relative px-3 sm:px-6 lg:px-12 py-12">
        <MandalaBackdrop />
        <div
          className="vsc-window relative z-10 mx-auto w-full max-w-[1320px] rounded-md overflow-hidden border border-[#ff6a00]/15 bg-[#1e1e1e]"
          style={{
            boxShadow:
              "0 40px 120px -20px rgba(0,0,0,0.85), 0 0 80px -10px rgba(255,106,0,0.22), inset 0 0 0 1px rgba(255,140,40,0.04)",
          }}
        >
          {/* ── Title bar (Windows style) ── */}
          <div className="flex items-center h-9 bg-[#3c3c3c] border-b border-black/40 select-none text-white/85">
            {/* Left: icon + menu */}
            <div className="flex items-center gap-2 pl-3 pr-2">{Icon.vscode}</div>
            <div className="hidden md:flex items-center h-full">
              {MENU.map((m, i) => (
                <button
                  key={m + i}
                  className={`px-2.5 h-full text-[12px] font-sans hover:bg-white/[0.08] ${
                    i === 0 ? "text-white" : "text-white/75"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Center: nav bar with back/forward + search */}
            <div className="flex-1 flex items-center justify-center px-3 gap-2 min-w-0">
              <button
                onClick={prev}
                aria-label="Previous project"
                className="p-1 rounded hover:bg-white/[0.08] text-white/60 hover:text-white"
              >
                {Icon.back}
              </button>
              <button
                onClick={next}
                aria-label="Next project"
                className="p-1 rounded hover:bg-white/[0.08] text-white/60 hover:text-white"
              >
                {Icon.fwd}
              </button>
              <div className="flex items-center gap-2 px-3 h-6 max-w-[420px] w-full bg-[#2a2a2a] border border-black/40 rounded text-white/65">
                {Icon.searchSm}
                <span className="text-[11px] font-mono truncate">portfolio</span>
                <span className="ml-auto" aria-hidden>{Icon.agamotto}</span>
              </div>
            </div>

            {/* Right: RUN + window controls */}
            <div className="flex items-center h-full">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 mr-1 rounded bg-[#0e3a1f] border border-[#1f7a3a]/60">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-[#28c840] animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#28c840]" />
                </span>
                <span className="text-[10px] font-mono text-[#7ee18a] tracking-[0.18em]">
                  RUNNING
                </span>
              </div>
              <button
                aria-label="Minimize"
                className="h-full w-11 flex items-center justify-center text-white/70 hover:bg-white/[0.08]"
              >
                {Icon.winMin}
              </button>
              <button
                aria-label="Maximize"
                className="h-full w-11 flex items-center justify-center text-white/70 hover:bg-white/[0.08]"
              >
                {Icon.winMax}
              </button>
              <button
                aria-label="Close"
                className="h-full w-11 flex items-center justify-center text-white/70 hover:bg-[#e81123] hover:text-white"
              >
                {Icon.winClose}
              </button>
            </div>
          </div>

          {/* ── Body: activity bar + sidebar + main editor ── */}
          <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[48px_240px_1fr] min-h-[640px]">
            {/* Activity bar */}
            <div className="bg-[#333333] border-r border-black/40 flex flex-col items-stretch py-2 text-white/70">
              <ActivityBtn active>{Icon.files}</ActivityBtn>
              <ActivityBtn>{Icon.search}</ActivityBtn>
              <ActivityBtn badge="8">{Icon.git}</ActivityBtn>
              <ActivityBtn>{Icon.debug}</ActivityBtn>
              <ActivityBtn badge="1">{Icon.ext}</ActivityBtn>
              <ActivityBtn>{Icon.beaker}</ActivityBtn>
              <div className="flex-1" />
              <ActivityBtn>{Icon.account}</ActivityBtn>
              <ActivityBtn>{Icon.gear}</ActivityBtn>
            </div>

            {/* Sidebar */}
            <aside className="hidden sm:flex flex-col bg-[#252526] border-r border-black/40 min-w-0">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-white/55">
                  Explorer
                </span>
                <span className="text-white/40">⋯</span>
              </div>

              {/* Portfolio root — collapsible */}
              <button
                onClick={() => setPortfolioOpen((v) => !v)}
                className="w-full px-3 pb-1.5 flex items-center gap-1 text-[11px] font-semibold text-white/85 uppercase hover:bg-white/[0.04] rounded-sm"
              >
                <span
                  className={`text-white/65 transition-transform duration-150 ${
                    portfolioOpen ? "rotate-90" : ""
                  }`}
                >
                  {Icon.chevron}
                </span>
                <span className="truncate">Portfolio</span>
              </button>

              {portfolioOpen && (
                <>
                  {/* projects/ folder — collapsible */}
                  <button
                    onClick={() => setProjectsOpen((v) => !v)}
                    className="w-full px-3 pb-1.5 flex items-center gap-1 text-[11.5px] text-white/75 hover:bg-white/[0.04] hover:text-white rounded-sm"
                  >
                    <span
                      className={`text-white/55 transition-transform duration-150 ${
                        projectsOpen ? "rotate-90" : ""
                      }`}
                    >
                      {Icon.chevron}
                    </span>
                    {Icon.folder}
                    <span className="truncate">projects</span>
                    <span className="ml-auto text-[9px] font-mono text-white/35">
                      {projects.length}
                    </span>
                  </button>

                  {projectsOpen && (
                    <div className="px-2 flex flex-col">
                      {projects.map((proj, i) => {
                        const isActive = i === active;
                        return (
                          <button
                            key={proj.fileName}
                            onClick={() => open(i)}
                            className={`group flex items-center gap-2 pl-7 pr-2 py-1 text-[12px] rounded-sm cursor-pointer text-left transition-colors duration-150 ${
                              isActive
                                ? "bg-[#37373d] text-white"
                                : "text-white/75 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-[2px] shrink-0"
                              style={{ backgroundColor: extColor[proj.fileExt] ?? "#888" }}
                            />
                            <span className="truncate">
                              {proj.fileName}.{proj.fileExt}
                            </span>
                            <span
                              className={`ml-auto text-[9.5px] font-mono ${
                                isActive ? "text-[#ff6a00]" : "text-white/30"
                              }`}
                            >
                              M
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                </>
              )}

              <div className="px-4 pt-5 pb-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-white/55">
                Outline
              </div>
              <div className="px-3 pb-3 text-[11.5px] text-white/45 italic">
                — {p.title} —
              </div>

              <div className="mt-auto px-4 py-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-white/55 border-t border-black/40">
                Timeline
              </div>
            </aside>

            {/* Main editor */}
            <main className="flex flex-col min-w-0">
              {/* Tab strip */}
              <div className="flex items-stretch bg-[#252526] border-b border-black/50 overflow-x-auto">
                {tabs.map((ti) => {
                  const t = projects[ti];
                  const isActive = ti === active;
                  return (
                    <div
                      key={ti}
                      onClick={() => setActive(ti)}
                      role="tab"
                      aria-selected={isActive}
                      className={`group relative flex items-center gap-2 h-9 pl-3 pr-1.5 text-[12px] font-mono border-r border-black/50 cursor-pointer whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-[#1e1e1e] text-white"
                          : "bg-[#2d2d2d] text-white/55 hover:text-white/85"
                      }`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-[2px]"
                        style={{ backgroundColor: extColor[t.fileExt] ?? "#888" }}
                      />
                      <span>
                        {t.fileName}.{t.fileExt}
                      </span>

                      {/* Slot: shows "M" by default, switches to clickable × on hover or when active */}
                      <span className="ml-1 relative w-5 h-5 flex items-center justify-center">
                        <span
                          className={`absolute text-[10px] transition-opacity ${
                            isActive
                              ? "opacity-0"
                              : "opacity-100 group-hover:opacity-0 text-white/40"
                          }`}
                        >
                          M
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(ti);
                          }}
                          aria-label={`Close ${t.fileName}.${t.fileExt}`}
                          tabIndex={isActive ? 0 : -1}
                          className={`absolute inset-0 flex items-center justify-center rounded-sm hover:bg-white/15 transition-opacity ${
                            isActive
                              ? "opacity-100 text-white/85"
                              : "opacity-0 group-hover:opacity-100 text-white/70"
                          }`}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                          >
                            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                          </svg>
                        </button>
                      </span>

                      {isActive && (
                        <span className="absolute top-0 left-0 right-0 h-px bg-[#ff6a00]" />
                      )}
                    </div>
                  );
                })}
                <div className="flex-1" />
              </div>

              {/* Breadcrumb */}
              <div className="px-4 py-1.5 text-[10.5px] font-mono text-white/45 bg-[#1e1e1e] border-b border-black/40 truncate">
                portfolio &nbsp;›&nbsp; projects &nbsp;›&nbsp; {p.fileName}.{p.fileExt}
              </div>

              {/* Showcase area — swipeable */}
              <div
                ref={editorRef}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                className="relative flex-1 bg-[#1e1e1e] cursor-grab active:cursor-grabbing select-none overflow-hidden"
              >
                {/* Carousel rail — each slide is 100% of editor width.
                    translateX(-N * 100%) shifts by exactly one editor width per step
                    (the percentage is of the rail's own width, which is 100% of editor
                    because we deliberately do NOT widen it; the children just overflow). */}
                <div
                  className="flex h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] w-full"
                  style={{
                    transform: `translateX(-${active * 100}%)`,
                  }}
                >
                  {projects.map((proj) => (
                    <div
                      key={proj.fileName}
                      className="flex-shrink-0 w-full h-full"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-0 h-full min-h-[440px]">
                        {/* Image */}
                        <div className="relative overflow-hidden bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proj.image}
                            alt={proj.title}
                            draggable={false}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#1e1e1e]/30 via-transparent to-[#1e1e1e]/60 pointer-events-none lg:bg-gradient-to-l lg:from-[#1e1e1e] lg:via-transparent lg:to-transparent" />
                          <span className="absolute top-3 right-3 text-[10px] font-mono text-white/85 tracking-[0.22em] bg-black/55 backdrop-blur px-2 py-1 border border-white/15 rounded-sm">
                            {proj.year}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="p-6 lg:p-8 flex flex-col gap-4 justify-center bg-[#1e1e1e]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#ff6a00]">
                            {proj.role}
                          </div>
                          <h3
                            className="leading-[1.05]"
                            style={{
                              fontFamily: "var(--font-display), 'Cinzel', serif",
                              fontWeight: 600,
                              fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)",
                              color: "#F0EDE6",
                              letterSpacing: "-0.015em",
                            }}
                          >
                            {proj.title}
                          </h3>
                          <p className="text-[13px] leading-relaxed text-white/65 max-w-[44ch]">
                            {proj.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.stack.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-mono px-2 py-1 rounded-sm bg-[#2d2d2d] text-white/75 border border-white/[0.06]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-2">
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.28em] text-[#ff6a00] hover:text-[#ffb070] transition-colors duration-300"
                            >
                              {Icon.external}
                              <span>Live Site</span>
                            </a>
                            <span className="text-[10px] font-mono text-white/35">
                              {String(active + 1).padStart(2, "0")}/
                              {String(projects.length).padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prev / Next overlay buttons */}
                <button
                  onClick={prev}
                  aria-label="Previous project"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/55 backdrop-blur border border-white/15 text-white/85 hover:bg-[#ff6a00] hover:border-[#ff6a00] transition-colors duration-300"
                >
                  {Icon.arrowL}
                </button>
                <button
                  onClick={next}
                  aria-label="Next project"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/55 backdrop-blur border border-white/15 text-white/85 hover:bg-[#ff6a00] hover:border-[#ff6a00] transition-colors duration-300"
                >
                  {Icon.arrowR}
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur border border-white/10">
                  {projects.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => open(i)}
                      aria-label={`Go to project ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === active
                          ? "w-6 bg-[#ff6a00]"
                          : "w-1.5 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Mini terminal panel */}
              <div className="bg-[#1e1e1e] border-t border-black/50">
                <div className="flex items-center gap-4 px-4 h-7 border-b border-black/40 text-[10.5px] font-mono uppercase tracking-[0.18em]">
                  <span className="text-white border-b-2 border-[#ff6a00] -mb-px py-1">
                    Terminal
                  </span>
                  <span className="text-white/45">Problems</span>
                  <span className="text-white/45">Output</span>
                  <span className="text-white/45">Debug Console</span>
                </div>
                <div className="px-4 py-2 text-[11px] font-mono space-y-0.5">
                  <div className="text-white/65">
                    <span className="text-[#7ee18a]">PS</span>{" "}
                    <span className="text-white/55">C:\Sanctum\portfolio&gt;</span>{" "}
                    <span className="text-white/85">npm run preview</span>{" "}
                    <span className="text-[#7ee18a]">— ✓ Ready</span>{" "}
                    <span className="text-white/45">· {p.buildTime}</span>
                  </div>
                  <div className="text-white/40 italic">
                    <span className="text-[#ff8c1a]">⟁</span>{" "}
                    <span className="text-[#ff6a00]">{p.fileName}.{p.fileExt}</span>{" "}
                    manifested in the mirror dimension
                    </div>
                </div>
              </div>
            </main>
          </div>

          {/* ── Status bar ── */}
          <div className="flex items-center justify-between h-6 px-3 bg-[#ff6a00] text-white text-[10.5px] font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                {Icon.branchSm}
                <span>{p.branch}</span>
              </span>
              <span className="flex items-center gap-1">
                {Icon.err}
                <span>0</span>
              </span>
              <span className="flex items-center gap-1">
                {Icon.warn}
                <span>0</span>
              </span>
              <span className="hidden md:inline opacity-90">
                Build Succeeded — 0 errors, 0 warnings · {p.buildTime}
              </span>
            </div>
            <div className="flex items-center gap-3 opacity-90">
              <span className="hidden sm:inline">{p.language}</span>
              <span className="hidden md:inline">UTF-8</span>
              <span>
                Ln 1, Col 1 · {String(active + 1).padStart(2, "0")}/
                {String(projects.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mystical motion CSS — rotating sigils */}
      <style>{`
        @keyframes mandala-spin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mandala-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes agamotto-spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .mandala-spin     { animation: mandala-spin     90s linear infinite; transform-origin: center center; }
        .mandala-spin-rev { animation: mandala-spin-rev 70s linear infinite; transform-origin: center center; }
        .agamotto-spin    { animation: agamotto-spin    18s linear infinite; transform-origin: center center; }

        @media (prefers-reduced-motion: reduce) {
          .mandala-spin, .mandala-spin-rev, .agamotto-spin { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

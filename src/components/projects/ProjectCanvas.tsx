"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";

const GRID_SIZE = 3;
const ZOOM_MIN = 0.375;
const ZOOM_MAX = 0.75;
const INITIAL_INDEX = 4; // center cell of a 3×3 grid

const IMAGES: { src: string; alt: string }[] = [
  { src: "/images/projects/disaster.png", alt: "Disaster project" },
  { src: "/images/projects/vocab.png", alt: "VocabVoyage" },
  { src: "/images/projects/eilish.png", alt: "Eilish project" },
  { src: "/images/projects/pentaxite.png", alt: "Pentaxite" },
  { src: "/images/projects/saas.png", alt: "SaaS Cater Pro" },
  { src: "/images/projects/lumen.png", alt: "Lumen" },
  { src: "/images/projects/atlas.png", alt: "Atlas" },
  { src: "/images/projects/forge.png", alt: "Forge" },
  { src: "/images/projects/fishfres.jpg", alt: "FishFresh" },
];

function clamp(a: number, min: number, max: number) {
  return Math.min(max, Math.max(min, a));
}

/**
 * ProjectCanvas — pan/zoom 3×3 grid of project images.
 *
 * Faithful port of the Plural DSGN canvas demo:
 *   • Click cell or minimap → pans the canvas to that cell
 *   • Arrow keys → grid-step navigation
 *   • Wheel → zoom (clamped to ZOOM_MIN..ZOOM_MAX)
 *   • Click central focus / Enter → opens the selected image full-screen
 *   • Open state hides the minimap + crosshair, reveals the close button
 */
export default function ProjectCanvas() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(INITIAL_INDEX);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [transitioning, setTransitioning] = useState(false);
  const [inView, setInView] = useState(false);

  const x = selected % GRID_SIZE;
  const y = Math.floor(selected / GRID_SIZE);

  const select = useCallback(
    (i: number) => {
      if (transitioning || i === selected) return;
      setSelected(i);
    },
    [selected, transitioning],
  );

  const toggleOpen = useCallback(() => {
    if (transitioning) return;
    setOpen((o) => !o);
  }, [transitioning]);

  // Track whether the canvas is in the viewport — gates global listeners
  // (keyboard, wheel) so they don't hijack the rest of the page.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio > 0.5),
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Keyboard navigation — only when in view
  useEffect(() => {
    if (!inView) return;
    const handle = (ev: KeyboardEvent) => {
      if (transitioning) return;
      const maxIdx = GRID_SIZE - 1;
      let nx = x;
      let ny = y;
      switch (ev.key) {
        case "ArrowLeft":
          nx--;
          break;
        case "ArrowRight":
          nx++;
          break;
        case "ArrowUp":
          ny--;
          break;
        case "ArrowDown":
          ny++;
          break;
        case "Enter":
        case " ":
          ev.preventDefault();
          toggleOpen();
          return;
        default:
          return;
      }
      ev.preventDefault();
      nx = clamp(nx, 0, maxIdx);
      ny = clamp(ny, 0, maxIdx);
      select(ny * GRID_SIZE + nx);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [inView, x, y, transitioning, select, toggleOpen]);

  // Wheel zoom — only when cursor is inside the canvas and section is in view
  useEffect(() => {
    if (!inView) return;
    const node = rootRef.current;
    if (!node) return;
    const handle = (ev: WheelEvent) => {
      if (transitioning || open) return;
      const rect = node.getBoundingClientRect();
      if (
        ev.clientX < rect.left ||
        ev.clientX > rect.right ||
        ev.clientY < rect.top ||
        ev.clientY > rect.bottom
      )
        return;
      ev.preventDefault();
      setZoom((z) => clamp(z + ev.deltaY * -0.0008, ZOOM_MIN, ZOOM_MAX));
    };
    document.addEventListener("wheel", handle, { passive: false });
    return () => document.removeEventListener("wheel", handle);
  }, [inView, transitioning, open]);

  // Track transitions on transform so we don't accept input mid-pan/zoom.
  const onTransitionRun = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === "transform") setTransitioning(true);
  };
  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === "transform") setTransitioning(false);
  };

  return (
    <div ref={rootRef} className={`pc-root ${open ? "is-open" : ""}`}>
      <div
        className="pc-viewport"
        style={{ ["--zoom" as string]: zoom } as CSSProperties}
        onTransitionRun={onTransitionRun}
        onTransitionEnd={onTransitionEnd}
      >
        <div
          className="pc-canvas"
          style={
            {
              ["--x" as string]: x,
              ["--y" as string]: y,
            } as CSSProperties
          }
          onTransitionRun={onTransitionRun}
          onTransitionEnd={onTransitionEnd}
        >
          {IMAGES.map((img, i) => (
            <button
              type="button"
              key={img.src}
              className={`pc-cell ${i === selected ? "is-selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                select(i);
              }}
              aria-label={img.alt}
              tabIndex={-1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" />
            </button>
          ))}
        </div>
      </div>

      {/* Mini-map */}
      <div className="pc-map-wrap" aria-hidden>
        <div className="pc-map">
          {IMAGES.map((img, i) => (
            <button
              type="button"
              key={img.src}
              className={i === selected ? "is-selected" : ""}
              onClick={() => select(i)}
              aria-label={`Pan to ${img.alt}`}
            />
          ))}
        </div>
      </div>

      {/* Close button (visible in open state) */}
      <button type="button" className="pc-back" onClick={() => setOpen(false)}>
        close
      </button>

      {/* Click target to open / close the selected image */}
      <div className="pc-focus-wrap">
        <button
          type="button"
          className="pc-focus"
          onClick={toggleOpen}
          aria-label={open ? "Close image" : "Expand image"}
        />
      </div>

      {/* Center crosshair HUD */}
      <div className="pc-crosshair" aria-hidden>
        <span className="pc-v" />
        <span className="pc-h" />
        <span className="pc-r" />
      </div>

      <style jsx>{`
        .pc-root {
          --pc-grid: ${GRID_SIZE};
          --pc-ease-in: cubic-bezier(0.32, 0, 0.67, 0);
          --pc-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
          --pc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
          /* Buttery deceleration curve (expo-out) — used for the pan/zoom
             transforms so the canvas glides into place rather than snapping. */
          --pc-ease-glide: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #111;
          /* Break out of any constrained parent — full-bleed */
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
        }

        .pc-viewport {
          --zoom: ${ZOOM_MIN};
          position: absolute;
          inset: 0;
          width: 100vw;
          height: 100vh;
          transform: scale3d(var(--zoom), var(--zoom), 1);
          transform-origin: center;
          transition: transform 1.05s var(--pc-ease-glide);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          z-index: 4;
        }

        .pc-canvas {
          --x: 0;
          --y: 0;
          --gap: 2rem;
          position: absolute;
          display: grid;
          grid-template-columns: repeat(${GRID_SIZE}, 100vw);
          width: -webkit-fit-content;
          width: -moz-fit-content;
          width: fit-content;
          gap: var(--gap);
          transform: translate3d(
            calc((-100vw * var(--x, 0)) - (var(--gap) * var(--x, 0))),
            calc((-100vh * var(--y, 0)) - (var(--gap) * var(--y, 0))),
            0
          );
          transition: transform 1.1s var(--pc-ease-glide);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-origin: left top;
          z-index: 5;
        }

        .pc-cell {
          width: 100vw;
          height: 100vh;
          border-radius: 2rem;
          opacity: 0.25;
          overflow: hidden;
          background-color: #fff;
          transition: opacity 0.85s var(--pc-ease-glide);
          cursor: pointer;
          position: relative;
          padding: 0;
          border: none;
          display: block;
        }

        .pc-cell img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale3d(2, 2, 2);
          transition: transform 1.05s var(--pc-ease-glide);
          will-change: transform;
          pointer-events: none;
          user-select: none;
        }

        .pc-cell.is-selected {
          opacity: 1;
          pointer-events: none;
        }

        .pc-focus-wrap {
          display: flex;
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
        }

        .pc-focus {
          width: 100%;
          height: 100%;
          transform: scale(${ZOOM_MIN});
          margin: auto;
          border-radius: 2rem;
          border: 2px solid whitesmoke;
          backface-visibility: hidden;
          overflow: hidden;
          user-select: none;
          cursor: zoom-in;
          background: transparent;
          pointer-events: all;
          padding: 0;
        }

        .pc-map-wrap {
          opacity: 1;
          transition: opacity 0.6s var(--pc-ease-in);
          position: absolute;
          bottom: 0;
          right: 0;
          margin: 2rem;
          width: 8rem;
          height: 8rem;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          background-color: rgba(34, 34, 34, 0.1);
          padding: 0.5rem;
          z-index: 7;
        }

        .pc-map {
          display: grid;
          grid-template: repeat(${GRID_SIZE}, 1fr) / repeat(${GRID_SIZE}, 1fr);
          height: 100%;
          width: 100%;
          gap: 4px;
        }

        .pc-map > button {
          background-color: whitesmoke;
          border-radius: 0.1em;
          opacity: 0.1;
          transition: opacity 0.3s var(--pc-ease-in-out);
          cursor: pointer;
          border: none;
          padding: 0;
        }

        .pc-map > button.is-selected {
          opacity: 1;
          pointer-events: none;
        }

        .pc-map > button:hover:not(.is-selected) {
          opacity: 0.6;
        }

        .pc-back {
          position: absolute;
          top: 0;
          left: 0;
          margin: 2rem;
          padding: 0.5rem 1.5rem;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          background-color: rgba(14, 13, 13, 0.4);
          border-radius: 2rem;
          color: whitesmoke;
          opacity: 0;
          transition: opacity 0.6s var(--pc-ease-out);
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.03em;
          pointer-events: none;
          z-index: 8;
          border: none;
          cursor: pointer;
        }

        .pc-crosshair {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          margin: auto;
          pointer-events: none;
          z-index: 10;
          width: 2rem;
          height: 2rem;
          display: flex;
          opacity: 1;
          transition: opacity 0.6s;
        }

        .pc-r {
          width: 5px;
          height: 5px;
          z-index: 1;
          background-color: #fff;
          margin: auto;
        }

        .pc-v,
        .pc-h {
          background-color: #fff;
          position: absolute;
          margin: auto;
        }

        .pc-v {
          width: 1px;
          height: 100%;
          left: calc(1rem - 0.5px);
        }

        .pc-h {
          width: 100%;
          height: 1px;
          top: calc(1rem - 0.5px);
        }

        /* OPEN STATE */
        .pc-root.is-open .pc-viewport {
          transform: scale3d(1, 1, 1);
        }
        .pc-root.is-open .pc-cell.is-selected img {
          transform: scale3d(1, 1, 1);
        }
        .pc-root.is-open .pc-map-wrap {
          opacity: 0;
          pointer-events: none;
        }
        .pc-root.is-open .pc-focus-wrap,
        .pc-root.is-open .pc-crosshair {
          opacity: 0;
        }
        .pc-root.is-open .pc-focus {
          cursor: zoom-out;
        }
        .pc-root.is-open .pc-back {
          opacity: 1;
          pointer-events: all;
        }

        @media (max-width: 1200px) {
          .pc-map-wrap {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

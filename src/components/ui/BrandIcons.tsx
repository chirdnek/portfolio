/**
 * BrandIcons — flat monochrome SVG marks for the stack/marquee.
 *
 * All icons render as `currentColor` so they pick up the surrounding text
 * color (default: muted), and gain accent color on hover.
 */
type IconProps = { className?: string; size?: number };

const cx = (className: string, extra = "") => `${extra} ${className}`.trim();

export function ReactIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="-11.5 -10.23174 23 20.46348" width={size} height={size} className={cx(className)} fill="none" stroke="currentColor" strokeWidth="1">
      <circle r="2.05" fill="currentColor" stroke="none" />
      <g>
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

export function NextIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 180 180" width={size} height={size} className={cx(className)} fill="currentColor">
      <mask id="next-mask" maskUnits="userSpaceOnUse" width="180" height="180" x="0" y="0" style={{ maskType: "alpha" }}>
        <circle cx="90" cy="90" r="90" fill="black" />
      </mask>
      <g mask="url(#next-mask)">
        <circle cx="90" cy="90" r="90" />
        <path d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461c3.334-2.231 6.51-4.68 9.509-7.325Z" fill="#fff" />
        <rect x="115" y="54" width="12" height="72" fill="#fff" />
      </g>
    </svg>
  );
}

export function TypeScriptIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} className={cx(className)}>
      <rect width="256" height="256" rx="20" fill="currentColor" />
      <path
        d="M150.5 200.5v27.6c4.5 2.3 9.8 4 16 5.2 6.1 1.1 12.6 1.7 19.4 1.7 6.6 0 12.9-.6 18.8-1.9s11.2-3.4 15.7-6.3c4.5-2.9 8-6.7 10.7-11.4s3.9-10.5 3.9-17.4c0-5-.7-9.4-2.2-13.2a30.7 30.7 0 0 0-6.5-10c-2.8-3-6.2-5.6-10.1-7.9-3.9-2.4-8.4-4.5-13.4-6.6-3.6-1.5-6.9-3-9.7-4.4-2.9-1.4-5.4-2.8-7.4-4.3-2-1.5-3.6-3-4.7-4.7s-1.6-3.5-1.6-5.6c0-1.9.5-3.6 1.5-5.1s2.4-2.8 4.1-3.9c1.8-1.1 4-2 6.6-2.5s5.5-.9 8.6-.9c2.3 0 4.7.2 7.3.5s5.1.9 7.7 1.6 5.2 1.6 7.6 2.7c2.3 1.1 4.6 2.4 6.8 3.8v-25.8c-4.2-1.6-8.8-2.8-13.8-3.6s-10.7-1.2-17.1-1.2c-6.6 0-12.8.7-18.7 2.1-5.9 1.4-11 3.6-15.5 6.6s-8 6.8-10.6 11.4-3.9 10.2-3.9 16.6c0 8.2 2.4 15.2 7.1 21 4.8 5.8 12 10.7 21.6 14.8a292 292 0 0 1 10.6 4.6c3.3 1.5 6.1 3 8.5 4.7 2.4 1.6 4.3 3.4 5.7 5.3 1.4 1.9 2.1 4 2.1 6.5 0 1.7-.4 3.4-1.3 5s-2.2 2.8-3.9 4-3.9 2-6.6 2.6c-2.6.6-5.7 1-9.2 1-6 0-11.9-1.1-17.8-3.2s-11.3-5.2-16.3-9.5Zm-46-68.7H140V109H41v22.7h35.3V233h28.1V131.8Z"
        fill="#0a0a0a"
      />
    </svg>
  );
}

export function TailwindIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 256 154" width={size} height={size} className={cx(className)} fill="currentColor">
      <path d="M128 0C93.867 0 72.533 17.067 64 51.2 76.8 34.133 91.733 27.733 108.8 32c9.737 2.434 16.697 9.499 24.401 17.318C145.751 62.057 160.275 76.8 192 76.8c34.133 0 55.467-17.067 64-51.2-12.8 17.067-27.733 23.467-44.8 19.2-9.737-2.434-16.697-9.499-24.401-17.318C174.249 14.743 159.725 0 128 0ZM64 76.8C29.867 76.8 8.533 93.867 0 128c12.8-17.067 27.733-23.467 44.8-19.2 9.737 2.434 16.697 9.499 24.401 17.318C81.751 138.857 96.275 153.6 128 153.6c34.133 0 55.467-17.067 64-51.2-12.8 17.067-27.733 23.467-44.8 19.2-9.737-2.434-16.697-9.499-24.401-17.318C110.249 91.543 95.725 76.8 64 76.8Z" />
    </svg>
  );
}

export function NodeIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 256 292" width={size} height={size} className={cx(className)} fill="currentColor">
      <path d="M134.9 1.8a13.9 13.9 0 0 0-13.8 0L6.8 67.8A13.6 13.6 0 0 0 0 79.7v132.2c0 4.9 2.7 9.5 6.8 12l114.3 65.9a13.9 13.9 0 0 0 13.8 0l114.3-65.9a13.6 13.6 0 0 0 6.8-12V79.8a13.6 13.6 0 0 0-6.8-12L134.9 1.8Z" />
    </svg>
  );
}

export function VercelIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 76 65" width={size} height={size} className={cx(className)} fill="currentColor">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

export function GitHubIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cx(className)} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function FigmaIcon({ className = "", size = 28 }: IconProps) {
  return (
    <svg viewBox="0 0 54 80" width={size} height={size} className={cx(className)}>
      <path d="M13.3 80a13.3 13.3 0 0 0 13.4-13.3V53.3H13.3a13.3 13.3 0 0 0 0 26.7Z" fill="currentColor" />
      <path d="M0 40a13.3 13.3 0 0 1 13.3-13.3h13.4v26.6H13.3A13.3 13.3 0 0 1 0 40Z" fill="currentColor" opacity="0.85" />
      <path d="M0 13.3A13.3 13.3 0 0 1 13.3 0h13.4v26.7H13.3A13.3 13.3 0 0 1 0 13.3Z" fill="currentColor" opacity="0.7" />
      <path d="M26.7 0H40a13.3 13.3 0 0 1 0 26.7H26.7V0Z" fill="currentColor" opacity="0.55" />
      <path d="M53.3 40A13.3 13.3 0 1 1 26.7 40a13.3 13.3 0 0 1 26.6 0Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export const BRAND_ICONS = [
  { id: "react", label: "React", Icon: ReactIcon },
  { id: "next", label: "Next.js", Icon: NextIcon },
  { id: "ts", label: "TypeScript", Icon: TypeScriptIcon },
  { id: "tailwind", label: "Tailwind CSS", Icon: TailwindIcon },
  { id: "node", label: "Node.js", Icon: NodeIcon },
  { id: "vercel", label: "Vercel", Icon: VercelIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
  { id: "figma", label: "Figma", Icon: FigmaIcon },
] as const;

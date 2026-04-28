"use client";

const topRow = [
  "HTML",
  "JavaScript",
  "Figma",
  "Tailwind",
  "React Native",
  "Android",
  "TypeScript",
  "Next.js",
];

const bottomRow = [
  "GSAP",
  "Node.js",
  "Firebase",
  "Supabase",
  "Git",
  "REST APIs",
  "CSS",
  "React",
];

function MarqueeRow({
  items,
  direction = "left",
  duration = 30,
}: {
  items: string[];
  direction?: "left" | "right";
  duration?: number;
}) {
  const repeated = [...items, ...items];

  return (
    <div className="w-full overflow-hidden">
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
      <div
        className="flex items-center gap-6 sm:gap-8 whitespace-nowrap"
        style={{
          animation: `scroll-${direction} ${duration}s linear infinite`,
        }}
      >
        {repeated.map((skill, i) => (
          <div key={i} className="flex items-center gap-6 sm:gap-8">
            <span className="text-2xl sm:text-4xl lg:text-6xl font-bold uppercase tracking-tight text-white/90">
              {skill}
            </span>
            {i < repeated.length - 1 && (
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#c8e64a] flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Technical() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "50vh" }}
    >

      {/* Content */}
      <div className="relative z-30 w-full flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-12 sm:mb-16 w-full">
          <span className="text-xs font-mono text-[#ff6a00] tracking-wider">002</span>
          <span className="w-12 h-px bg-[#ff6a00]/40" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#ff6a00]">Technical Arsenal</span>
        </div>

        {/* Marquee rows */}
        <div className="w-full space-y-6 sm:space-y-8">
          <MarqueeRow items={topRow} direction="left" duration={40} />
          <MarqueeRow items={bottomRow} direction="right" duration={45} />
        </div>
      </div>
    </section>
  );
}

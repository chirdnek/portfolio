"use client";

/* ─── Custom Brand SVG Icons ─── */

const FigmaIcon = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" id="figma">
  <path fill="#161616" fillRule="evenodd" d="m60,12c0-4.42-3.58-8-8-8H12c-4.42,0-8,3.58-8,8v40c0,4.42,3.58,8,8,8h40c4.42,0,8-3.58,8-8V12h0Z"></path>
  <path fill="#0cc2ff" fillRule="evenodd" d="m39.01,25.01c3.87,0,7.01,3.14,7.01,7.01s-3.14,7.01-7.01,7.01-7.01-3.14-7.01-7.01,3.14-7.01,7.01-7.01h0Z"></path>
  <path fill="#ff7568" fillRule="evenodd" d="m46,18c0-3.87-3.13-7-7-7h-14.02c-3.87,0-7,3.13-7,7s3.13,7,7,7h14.02c3.87,0,7-3.13,7-7h0Z"></path>
  <path fill="#af5bff" fillRule="evenodd" d="m31.99,25.01h-7.01c-1.86,0-3.64.74-4.95,2.05-1.31,1.31-2.05,3.09-2.05,4.95s.74,3.64,2.05,4.95c1.31,1.31,3.09,2.05,4.95,2.05h7.01v-14h0Z"></path>
  <path fill="#ff4611" fillRule="evenodd" d="m31.99,11h-7.01c-1.86,0-3.64.74-4.95,2.05-1.31,1.31-2.05,3.09-2.05,4.95s.74,3.64,2.05,4.95c1.31,1.31,3.09,2.05,4.95,2.05h7.01v-14h0Z"></path>
  <path fill="#00e681" fillRule="evenodd" d="m32,38.99h-7.01c-1.86,0-3.64.74-4.95,2.05-1.31,1.31-2.05,3.09-2.05,4.95s.74,3.64,2.05,4.95c1.31,1.31,3.09,2.05,4.95,2.05h0c1.86,0,3.64-.74,4.95-2.05,1.31-1.31,2.05-3.09,2.05-4.95v-7h0Z"></path>
</svg>
);

const ReactIcon = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
<path fill="#ffd600" d="M6,42V6h36v36H6z"></path><path fill="#000001" d="M29.538 32.947c.692 1.124 1.444 2.201 3.037 2.201 1.338 0 2.04-.665 2.04-1.585 0-1.101-.726-1.492-2.198-2.133l-.807-.344c-2.329-.988-3.878-2.226-3.878-4.841 0-2.41 1.845-4.244 4.728-4.244 2.053 0 3.528.711 4.592 2.573l-2.514 1.607c-.553-.988-1.151-1.377-2.078-1.377-.946 0-1.545.597-1.545 1.377 0 .964.6 1.354 1.985 1.951l.807.344C36.452 29.645 38 30.839 38 33.523 38 36.415 35.716 38 32.65 38c-2.999 0-4.702-1.505-5.65-3.368L29.538 32.947zM17.952 33.029c.506.906 1.275 1.603 2.381 1.603 1.058 0 1.667-.418 1.667-2.043V22h3.333v11.101c0 3.367-1.953 4.899-4.805 4.899-2.577 0-4.437-1.746-5.195-3.368L17.952 33.029z"></path>
</svg>
);

const FlutterIcon = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
 <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
<polygon fill="#40c4ff" points="26,4 6,24 12,30 38,4"></polygon><polygon fill="#40c4ff" points="38,22 27,33 21,27 26,22"></polygon><rect width="8.485" height="8.485" x="16.757" y="28.757" fill="#03a9f4" transform="rotate(-45.001 21 33)"></rect><polygon fill="#01579b" points="38,44 26,44 21,39 27,33"></polygon><polygon fill="#084994" points="21,39 30,36 27,33"></polygon>
</svg>
);

const PythonIcon = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
<path fill="#0277BD" d="M24.047,5c-1.555,0.005-2.633,0.142-3.936,0.367c-3.848,0.67-4.549,2.077-4.549,4.67V14h9v2H15.22h-4.35c-2.636,0-4.943,1.242-5.674,4.219c-0.826,3.417-0.863,5.557,0,9.125C5.851,32.005,7.294,34,9.931,34h3.632v-5.104c0-2.966,2.686-5.896,5.764-5.896h7.236c2.523,0,5-1.862,5-4.377v-8.586c0-2.439-1.759-4.263-4.218-4.672C27.406,5.359,25.589,4.994,24.047,5z M19.063,9c0.821,0,1.5,0.677,1.5,1.502c0,0.833-0.679,1.498-1.5,1.498c-0.837,0-1.5-0.664-1.5-1.498C17.563,9.68,18.226,9,19.063,9z"></path><path fill="#FFC107" d="M23.078,43c1.555-0.005,2.633-0.142,3.936-0.367c3.848-0.67,4.549-2.077,4.549-4.67V34h-9v-2h9.343h4.35c2.636,0,4.943-1.242,5.674-4.219c0.826-3.417,0.863-5.557,0-9.125C41.274,15.995,39.831,14,37.194,14h-3.632v5.104c0,2.966-2.686,5.896-5.764,5.896h-7.236c-2.523,0-5,1.862-5,4.377v8.586c0,2.439,1.759,4.263,4.218,4.672C19.719,42.641,21.536,43.006,23.078,43z M28.063,39c-0.821,0-1.5-0.677-1.5-1.502c0-0.833,0.679-1.498,1.5-1.498c0.837,0,1.5,0.664,1.5,1.498C29.563,38.32,28.899,39,28.063,39z"></path>
</svg>
);

/* ─── Data ─── */

const skills = [
  { label: "UI Design", percentage: 90 },
  { label: "App Development", percentage: 80 },
  { label: "User Research", percentage: 85 },
  { label: "Coding", percentage: 60 },
  { label: "No Code Tools", percentage: 65 },
];

const skillCategories = [
  { icon: FigmaIcon, label: "UI Design" },
  { icon: ReactIcon, label: "Web Dev" },
  { icon: FlutterIcon, label: "App Development" },
  { icon: PythonIcon, label: "Coding" },
];

const tools = [
  { name: "Figma", icon: "🎨" },
  { name: "Framer", icon: "✨" },
];

/* ─── Component ─── */

export default function MySkills() {
  return (
    <section
      className="relative pb-20 md:pb-32 pt-6 overflow-hidden"
    >

      <div className="relative z-10 container-custom">
        {/* Section nav indicator */}
        
        <div className="flex items-center gap-4 mb-6 ">
          <span className="text-xs font-mono text-[#ff6a00] tracking-wider ml-4">004</span>
          <span className="w-12 h-px bg-[#ff6a00]/40" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#ff6a00]">Skills</span>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8 md:p-12 border border-white/[0.12] shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Top row — Title + Description + Icons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left — Title & Description */}
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-white"
              >
                <span className="italic font-light">My Professional</span>
                <br />
                Background Skills and
                <br />
                Accomplishments
              </h2>
              <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-md">
                I specialize in creating digital experiences through design and
                development. With expertise in UI/UX design, web development,
                and product design, I deliver thoughtful solutions that combine
                aesthetics with functionality.
              </p>
            </div>

            {/* Right — Skill category icons in a row */}
            <div
              className="flex items-center justify-center gap-5 md:gap-8"
            >
              {skillCategories.map((skill, idx) => {
                const Icon = skill.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-3">
                    <div
                      className="w-24 h-24 md:w-24 md:h-32 rounded-[50%] border border-white/15 flex items-center justify-center
                                 hover:border-white/30 transition-all duration-300 group"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06), transparent 70%)",
                      }}
                    >
                      <Icon
                        size={36}
                        className="text-white/70 group-hover:text-white transition-colors"
                      />
                    </div>
                    <span className="text-xs md:text-sm text-white/50 text-center">
                      {skill.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill bars */}
          <div className="mt-14 pt-10 border-t border-white/[0.08]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
              {skills.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-sm md:text-base text-white/80 font-medium">
                      {skill.label}
                    </span>
                    <span className="text-xs md:text-sm text-white/40 tabular-nums">
                      {skill.percentage}%
                    </span>
                  </div>
                  {/* Track */}
                  <div className="relative h-[5px] bg-white/10 rounded-full">
                    {/* Filled bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${skill.percentage}%`,
                        background: "none",
                        backgroundColor: skill.percentage >= 75 ? "#00e676" : "#ff3d3d",
                      }}
                    />
                    {/* Thumb circle */}
                    <div
                      className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none"
                      style={{
                        left: `${skill.percentage}%`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: skill.percentage >= 75 ? "#00e676" : "#ff3d3d",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="mt-10 pt-10 border-t border-white/[0.08]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-5">
              Tools & Platforms
            </p>
            <div className="flex flex-wrap gap-4">
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg border border-white/10
                             hover:border-white/25 hover:bg-white/[0.03] transition-all duration-300"
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-sm text-white/60">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
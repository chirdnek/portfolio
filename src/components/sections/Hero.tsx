"use client";

export default function Hero() {
  return (
    <>
      <section
        id="hero-section"
        className="relative z-20 flex flex-col justify-center items-center min-h-screen overflow-hidden"
      >
        {/* ── Top fade bridge — pure black top blending into IntroSection's dark bottom ── */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 pointer-events-none z-0"
          style={{
            height: "50vh",
            background:
              "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.45) 55%, transparent 100%)",
          }}
        />

        {/* Main Content - Centered */}
        <div className="relative z-10 flex flex-col items-center justify-center mt-10 sm:mt-16 w-full px-6 sm:px-10 lg:px-20">
          {/* Big Headline with Profile Image */}
          <div className="relative">
            {/* Profile Image - sits behind the text */}
            <div
              className="hero-profile absolute top-1/2 left-0 -translate-x-[15%] -translate-y-[40%] w-[clamp(160px,22vw,320px)] aspect-[3/4] z-0"
              style={{ opacity: 0.85 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
          
          {/* Name badge */}
<div
  className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap"
  style={{
    backgroundColor: "rgba(240, 237, 230, 0.95)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  }}
>
  <span
    className="w-2.5 h-2.5 rounded-full shrink-0"
    style={{ backgroundColor: "#a3e635" }}
  />
  <span
    className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-neutral-700 font-medium"
    style={{ fontFamily: "sans-serif" }}
  >
    Kendrick Serrano
  </span>
</div>

              <img
                src="/images/profile.png"
                alt="Kendrick Serrano"
                className="w-full h-full object-cover grayscale-[30%]"
                style={{
                  maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                }}
              />
            </div>

            <h1
              className="relative z-10"
              style={{
                fontFamily: "var(--font-display), 'Cinzel', 'Trajan Pro', serif",
                fontWeight: 100,
                lineHeight: 0.9,
                color: "#F0EDE6",
                letterSpacing: "-0.20em"
              }}
            >
              <span className="hero-line block text-[clamp(2.5rem,8vw,7rem)] ml-20">
                LET&apos;S CREATE
              </span>
              <span className="hero-line block text-[clamp(2.5rem,8vw,7rem)] ml-[20vw]">
                PROJECTS THAT
              </span>
              <span className="hero-line block text-[clamp(2.5rem,8vw,7rem)] ml-40">
                STAND OUT.
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p
            className="mt-8 sm:mt-12 text-center text-sm sm:text-base text-white/60 max-w-md leading-relaxed"
            style={{ fontFamily: "sans-serif", letterSpacing: "0.02em" }}
          >
            Reach out for collaborations, commissions,
            <br />
            or just to connect.
          </p>

          {/* Contact Info */}
          <div className="mt-10 sm:mt-14 flex flex-col items-center gap-4">
            <a
              href="mailto:kendrickserrano7@gmail.com"
              className="contact-item text-[clamp(0.9rem,2.5vw,1.4rem)] font-medium tracking-wide text-white/90 hover:text-white transition-colors duration-300 lowercase"
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
                letterSpacing: "0.01em",
              }}
            >
              kendrickserrano7@gmail.com
            </a>
            <p
              className="contact-item text-[clamp(0.9rem,2.5vw,1.3rem)] text-white/70"
              style={{
                fontFamily: "var(--font-display), 'Cinzel', 'Trajan Pro', serif",
                letterSpacing: "0.05em",
              }}
            >
              Zamboanga City, Philippines
            </p>
          </div>
        </div>

        {/* Bottom Social Links */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5">
            <a
              href="#"
              className="social-link text-xs sm:text-sm uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors duration-300"
            >
              Instagram
            </a>

            <div className="flex items-center gap-6 sm:gap-8">
              <a
                href="https://www.linkedin.com/in/kendrick-serrano-b0a4853b1"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link text-xs sm:text-sm uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors duration-300"
              >
                LinkedIn
              </a>

              <a
                href="/CV/CV.pdf"
                download="Kendrick-Serrano-CV.pdf"
                aria-label="Download CV (PDF)"
                className="social-link group inline-flex items-center gap-2 px-4 py-2 border border-white/25 text-white/80 text-xs sm:text-sm uppercase tracking-[0.2em] hover:text-white hover:border-white hover:bg-white/5 transition-all duration-300"
              >
                <span>Resume</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden="true"
                >
                  <path d="M12 3v13" />
                  <path d="m6 11 6 6 6-6" />
                  <path d="M5 21h14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

      </section>
    </>
  );
}
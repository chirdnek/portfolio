"use client";

import Link from "next/link";

export default function Bottom() {
  return (
    <section className="pt-40 sm:pt-48 pb-0 border-t border-white/5 relative overflow-hidden">
      {/* Content */}
      <div className="container-custom text-center relative z-10">
        {/* Heading */}
        <h2
          className="section-title text-5xl sm:text-6xl lg:text-7xl font-black mb-6 tracking-tighter"
          style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
          data-reveal-heading
        >
          Let&apos;s Work Together
        </h2>

        {/* Subtitle */}
        <p
          className="section-subtitle text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mb-16"
          data-reveal-blur
        >
          Have a project in mind? I&apos;d love to hear from you. Let&apos;s create something extraordinary together.
        </p>

        {/* CTA Button */}
        <div data-reveal className="flex justify-center">
          <Link
            href="/contact"
            className="btn-primary px-10 py-4 text-sm font-semibold uppercase tracking-widest
                       shadow-lg hover:shadow-xl transition-all duration-300
                       relative overflow-hidden group"
            style={{ fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            <span className="relative z-10">Get In Touch</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Secondary text */}
        <p
          className="text-xs sm:text-sm text-white/20 mt-12 tracking-widest uppercase"
          data-reveal
          style={{ fontFamily: "'SF Mono', -apple-system, BlinkMacSystemFont, monospace" }}
        >
          Available for freelance projects and full-time opportunities
        </p>
      </div>

      {/* Big KENTO_O — flush to the bottom edge */}
      <div className="relative z-10 mt-16 sm:mt-20 select-none pointer-events-none overflow-hidden">
        <p
          className="text-[22vw] font-black text-center text-white/[0.06] whitespace-nowrap translate-y-[30%]"
          style={{
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: "-0.04em",
            lineHeight: "0.75",
          }}
        >
          KENTO_O
        </p>
      </div>
    </section>
  );
}
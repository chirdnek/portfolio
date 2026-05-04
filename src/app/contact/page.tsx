import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export const metadata: Metadata = {
  title: "Contact — Kendrick Serrano",
  description:
    "Open to collaborations, freelance projects, and full-time roles. Send a message — usually replies within a day.",
};

const socials = [
  {
    label: "Email",
    href: "mailto:kendrickserrano7@gmail.com",
    handle: "kendrickserrano7@gmail.com",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/chirdnek",
    handle: "@chirdnek",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/kendrickserrano",
    handle: "kendrickserrano",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="pt-32 pb-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Left: copy */}
            <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
              <RevealOnScroll blur={false}>
                <div className="mb-6 flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="mono-label">Replying within a day</span>
                </div>
              </RevealOnScroll>

              <RevealOnScroll>
                <h1
                  className="font-semibold tracking-display leading-[0.95] text-fg mb-8"
                  style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
                >
                  Let&apos;s talk<span className="text-accent">.</span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={0.1}>
                <p className="text-base sm:text-lg text-fg-muted leading-relaxed mb-12 max-w-md">
                  I&apos;m open to internships, freelance UI/UX and web/app
                  projects, and the occasional late-night collaboration.
                  Tell me what you&apos;re building.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={0.2} blur={false}>
                <div className="space-y-1">
                  <div className="mono-label mb-3">Or reach me at —</div>
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.label !== "Email" ? "_blank" : undefined}
                      rel={s.label !== "Email" ? "noopener noreferrer" : undefined}
                      className="group flex items-center justify-between gap-4 py-3 border-b border-subtle hover:border-strong transition-colors"
                    >
                      <span className="flex items-center gap-3 text-fg-muted group-hover:text-fg transition-colors duration-200">
                        <span className="text-fg-muted group-hover:text-accent transition-colors duration-200">
                          {s.icon}
                        </span>
                        <span className="text-sm">{s.label}</span>
                      </span>
                      <span className="text-xs font-mono text-fg-faint group-hover:text-fg-muted transition-colors duration-200 truncate">
                        {s.handle}
                      </span>
                    </a>
                  ))}
                </div>
              </RevealOnScroll>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-7">
              <RevealOnScroll blur={false}>
                <ContactForm />
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32" />
    </>
  );
}

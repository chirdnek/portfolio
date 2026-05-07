import type { Metadata } from "next";
import { certifications } from "@/data/certifications";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionDivider from "@/components/ui/SectionDivider";

export const metadata: Metadata = {
  title: "Certifications — Kendrick Serrano",
  description:
    "Selected certifications and ongoing courses across UI/UX, front-end, and mobile development.",
};

function initials(title: string): string {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function CertificationsPage() {
  const live = certifications.filter((c) => !c.inProgress);
  const inProgress = certifications.filter((c) => c.inProgress);

  return (
    <>
      <section className="pt-32 pb-12">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <div className="mono-label mb-4">
              {certifications.length} entries · ongoing
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h1
              className="font-semibold tracking-display leading-[0.95] text-fg max-w-4xl mb-8"
              style={{ fontSize: "clamp(2.5rem, 9vw, 6.5rem)" }}
            >
              Certifications<span className="text-accent">.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <p className="max-w-2xl text-base sm:text-lg text-fg-muted leading-relaxed">
              Coursework and credentials I&apos;ve picked up across UI/UX,
              front-end, and mobile. Mostly self-paced — focused on what
              I&apos;m using day-to-day.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <SectionDivider index="01" total="02" label="Awarded" />
      <section className="pt-8 pb-20">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {live.map((c) => (
                <CertCard key={c.slug} cert={c} />
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {inProgress.length > 0 && (
        <>
          <SectionDivider index="02" total="02" label="In progress" />
          <section className="pt-8 pb-32 sm:pb-40">
            <div className="container-custom">
              <RevealOnScroll blur={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {inProgress.map((c) => (
                    <CertCard key={c.slug} cert={c} />
                  ))}
                </div>
              </RevealOnScroll>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function CertCard({ cert }: { cert: typeof certifications[number] }) {
  const Wrapper: "a" | "div" = cert.credentialUrl ? "a" : "div";
  const wrapperProps = cert.credentialUrl
    ? {
        href: cert.credentialUrl,
        target: "_blank",
        rel: "noopener noreferrer" as const,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="cert-card group relative flex flex-col gap-4 p-5 sm:p-6 transition-all duration-300"
    >
      {/* Header — badge + status */}
      <div className="flex items-start justify-between gap-3">
        {cert.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cert.image}
            alt={`${cert.title} badge`}
            width={56}
            height={56}
            className="w-14 h-14 object-contain"
          />
        ) : (
          <div
            aria-hidden
            className="w-14 h-14 grid place-items-center font-display text-lg tracking-tight"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "10px",
              color: "rgba(255, 255, 255, 0.86)",
              backdropFilter: "blur(6px)",
            }}
          >
            {initials(cert.title)}
          </div>
        )}
        <div className="flex flex-col items-end gap-1">
          {cert.inProgress ? (
            <span className="mono-label text-[color:var(--hud)]">
              In progress
            </span>
          ) : (
            <span className="mono-label text-fg-faint">{cert.issued}</span>
          )}
          {cert.category && (
            <span className="mono-label text-fg-faint text-[10px]">
              {cert.category}
            </span>
          )}
        </div>
      </div>

      {/* Title + issuer */}
      <div>
        <h3 className="font-semibold text-fg leading-snug text-base sm:text-lg">
          {cert.title}
        </h3>
        <p className="mt-1 text-sm text-fg-muted">{cert.issuer}</p>
      </div>

      {/* Description */}
      {cert.description && (
        <p className="text-sm text-fg-muted leading-relaxed line-clamp-3">
          {cert.description}
        </p>
      )}

      {/* Footer — verifier link or status */}
      <div className="mt-auto pt-2 flex items-center justify-between text-fg-faint text-[11px] tracking-widest uppercase font-mono">
        <span>{cert.inProgress ? "Studying" : "Awarded"}</span>
        {cert.credentialUrl && (
          <span className="text-fg-muted group-hover:text-fg transition-colors">
            Verify ↗
          </span>
        )}
      </div>
    </Wrapper>
  );
}

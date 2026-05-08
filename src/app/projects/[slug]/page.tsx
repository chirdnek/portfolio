import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProjectBySlug } from "@/data/projects";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: `${project.title} — Kendrick Serrano`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const idx = projects.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? projects[idx - 1] : null;
  const next = idx < projects.length - 1 ? projects[idx + 1] : null;

  return (
    <>
      {/* ── Header ── */}
      <section className="pt-32 pb-16">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors duration-200 mb-12 group"
            >
              <span aria-hidden className="transition-transform duration-200 group-hover:-translate-x-0.5">
                ←
              </span>
              All work
            </Link>
          </RevealOnScroll>

          <RevealOnScroll blur={false}>
            <div className="mono-label mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>{project.featured ? "Featured project" : "Project"}</span>
              {project.year && (
                <>
                  <span aria-hidden className="text-fg-faint">·</span>
                  <span>{project.year}</span>
                </>
              )}
              {project.role && (
                <>
                  <span aria-hidden className="text-fg-faint">·</span>
                  <span>{project.role}</span>
                </>
              )}
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h1
              className="font-semibold tracking-display leading-[0.95] text-fg mb-10 max-w-4xl"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
            >
              {project.title}
              <span className="text-accent">.</span>
            </h1>
          </RevealOnScroll>

          {project.description && (
            <RevealOnScroll delay={0.1}>
              <p className="text-xl sm:text-2xl text-fg-muted leading-[1.55] font-light max-w-3xl tracking-[-0.005em]">
                {project.description}
              </p>
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* ── Cover image ── */}
      {project.image && (
        <section className="pb-12">
          <div className="container-custom">
            <RevealOnScroll blur={false}>
              <div className="relative overflow-hidden border border-[color:var(--border-strong)] aspect-[16/9]" style={{ borderRadius: "2px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.title}
                  className="aib-image w-full h-full object-cover"
                />
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* ── Gallery (additional screenshots) ── */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="pb-12">
          <div className="container-custom">
            <RevealOnScroll blur={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {project.gallery.map((src, i) => (
                  <div
                    key={src}
                    className="relative overflow-hidden border border-[color:var(--border-strong)] aspect-[4/3] group"
                    style={{ borderRadius: "2px" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${project.title} screen ${i + 2}`}
                      className="aib-image w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* ── Body: editorial 2-column ── */}
      <section className="pb-32 sm:pb-40">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Sticky meta sidebar */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-32 space-y-10">
                <MetaBlock label="Year" value={project.year ?? "2025"} />
                <MetaBlock
                  label="Role"
                  value={project.role ?? "UI/UX Designer & Developer"}
                />
                <MetaBlock label="Status" value={project.href && project.href !== "#" ? "Live" : "In progress"} />

                <div>
                  <div className="mono-label mb-3">Tools</div>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] tracking-wider uppercase text-fg-muted px-2.5 py-1 rounded-full border border-subtle"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {((project.href && project.href !== "#") || (project.repo && project.repo !== "#")) && (
                  <div className="space-y-3 pt-4 border-t border-subtle">
                    {project.href && project.href !== "#" && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full justify-between"
                      >
                        Visit site
                        <span aria-hidden>↗</span>
                      </a>
                    )}
                    {project.repo && project.repo !== "#" && (
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost w-full justify-between"
                      >
                        View source
                        <span aria-hidden>↗</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Long-form body */}
            <article className="lg:col-span-8 space-y-8 max-w-2xl">
              <RevealOnScroll blur={false}>
                <div className="mono-label mb-4">Overview</div>
                <p className="text-base sm:text-lg text-fg-muted leading-[1.75]">
                  {project.longDescription}
                </p>
              </RevealOnScroll>
            </article>
          </div>
        </div>
      </section>

      {/* ── Prev / Next ── */}
      <section className="border-t border-subtle">
        <div className="container-custom grid grid-cols-1 sm:grid-cols-2 divide-x divide-[color:var(--border)]">
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className="group p-8 sm:p-12 transition-colors hover:bg-white/[0.012]"
            >
              <div className="mono-label mb-3 flex items-center gap-2">
                <span aria-hidden className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
                Previous
              </div>
              <div className="text-xl sm:text-2xl font-semibold tracking-tight text-fg group-hover:text-accent transition-colors">
                {prev.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="group p-8 sm:p-12 sm:text-right transition-colors hover:bg-white/[0.012]"
            >
              <div className="mono-label mb-3 flex sm:justify-end items-center gap-2">
                Next
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </div>
              <div className="text-xl sm:text-2xl font-semibold tracking-tight text-fg group-hover:text-accent transition-colors">
                {next.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>
    </>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono-label mb-2">{label}</div>
      <div className="text-base text-fg">{value}</div>
    </div>
  );
}

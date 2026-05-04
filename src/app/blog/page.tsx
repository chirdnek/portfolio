import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionDivider from "@/components/ui/SectionDivider";

export const metadata: Metadata = {
  title: "Writing — Kendrick Serrano",
  description:
    "Notes on web engineering, design systems, and shipping high-craft software.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  // Group by year for editorial pacing
  const byYear = new Map<string, typeof posts>();
  for (const p of posts) {
    const year = p.date ? new Date(p.date).getFullYear().toString() : "Drafts";
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(p);
  }
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <>
      <section className="pt-32 pb-12">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <div className="mono-label mb-4">Writing</div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h1
              className="font-semibold tracking-display leading-[0.95] text-fg max-w-4xl mb-8"
              style={{ fontSize: "clamp(2.5rem, 9vw, 6.5rem)" }}
            >
              Notes & essays<span className="text-accent">.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <p className="max-w-2xl text-base sm:text-lg text-fg-muted leading-relaxed">
              Occasional writing on web engineering, design systems, and the
              craft of shipping software. Long-form when the topic earns it.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <SectionDivider
        index="01"
        total="01"
        label={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
      />

      {posts.length === 0 ? (
        <section className="pt-8 pb-32">
          <div className="container-custom">
            <RevealOnScroll>
              <div className="border border-subtle rounded-2xl p-16 text-center max-w-2xl mx-auto bg-white/[0.012]">
                <div className="text-5xl mb-4 font-mono text-fg-faint">∅</div>
                <h2 className="text-xl font-semibold mb-2 text-fg">
                  No posts yet.
                </h2>
                <p className="text-fg-muted">
                  Working on the first one. Check back soon.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>
      ) : (
        <section className="pt-8 pb-32 sm:pb-48">
          <div className="container-custom">
            {years.map((year, yi) => (
              <div key={year} className={yi > 0 ? "mt-20" : ""}>
                <RevealOnScroll blur={false}>
                  <div className="flex items-baseline gap-6 mb-8">
                    <div
                      className="font-mono text-fg-faint"
                      style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                    >
                      {year}
                    </div>
                    <div className="flex-1 h-px bg-[color:var(--border)]" />
                  </div>
                </RevealOnScroll>

                <ol className="border-t border-subtle">
                  {byYear.get(year)!.map((post, i) => (
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group grid grid-cols-12 items-baseline gap-4 sm:gap-8 py-6 sm:py-8 border-b border-subtle hover:bg-white/[0.012] transition-colors duration-200 px-2 -mx-2 rounded-md"
                      >
                        <span
                          className="col-span-1 font-mono text-fg-faint text-xs"
                          aria-hidden
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="col-span-11 sm:col-span-7">
                          <h2 className="text-lg sm:text-xl font-semibold text-fg group-hover:text-accent transition-colors duration-200 leading-snug">
                            {post.title}
                          </h2>
                          {post.description && (
                            <p className="mt-2 text-sm text-fg-muted leading-relaxed line-clamp-2">
                              {post.description}
                            </p>
                          )}
                        </div>

                        <div className="hidden sm:flex col-span-3 flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] tracking-wider uppercase text-fg-muted px-2 py-0.5 rounded border border-subtle"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <time
                          dateTime={post.date}
                          className="hidden sm:block col-span-1 text-right font-mono text-fg-faint text-xs whitespace-nowrap"
                        >
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

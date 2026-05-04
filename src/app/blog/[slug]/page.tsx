import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs, getAllPosts } from "@/lib/blog";
import MdxContent from "@/components/MdxContent";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} — Kendrick Serrano`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

function readingTime(content: string): number {
  const wordsPerMinute = 220;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const minutes = readingTime(post.content);
  const all = getAllPosts();
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <>
      {/* ── Header ── */}
      <section className="pt-32 pb-12">
        <div className="container-custom">
          <RevealOnScroll blur={false}>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors duration-200 mb-12 group"
            >
              <span aria-hidden className="transition-transform duration-200 group-hover:-translate-x-0.5">
                ←
              </span>
              All writing
            </Link>
          </RevealOnScroll>

          <RevealOnScroll blur={false}>
            <div className="mono-label mb-4 flex items-center gap-3 flex-wrap">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span aria-hidden className="text-fg-faint">·</span>
              <span>{minutes} min read</span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <h1
              className="font-semibold tracking-display leading-[1.05] text-fg max-w-3xl mb-6"
              style={{ fontSize: "clamp(2rem, 6vw, 4.25rem)" }}
            >
              {post.title}
            </h1>
          </RevealOnScroll>

          {post.description && (
            <RevealOnScroll delay={0.1}>
              <p className="text-lg sm:text-xl text-fg-muted max-w-2xl leading-relaxed">
                {post.description}
              </p>
            </RevealOnScroll>
          )}

          {post.tags.length > 0 && (
            <RevealOnScroll delay={0.15} blur={false}>
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] tracking-wider uppercase text-fg-muted px-2.5 py-1 rounded-full border border-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </RevealOnScroll>
          )}
        </div>
      </section>

      {/* ── Content ── */}
      <section className="pt-12 pb-32 sm:pb-40 border-t border-subtle">
        <div className="container-custom">
          <MdxContent source={post.content} />
        </div>
      </section>

      {/* ── Prev / Next ── */}
      <section className="border-t border-subtle">
        <div className="container-custom grid grid-cols-1 sm:grid-cols-2 divide-x divide-[color:var(--border)]">
          {prev ? (
            <Link
              href={`/blog/${prev.slug}`}
              className="group p-8 sm:p-12 transition-colors hover:bg-white/[0.012]"
            >
              <div className="mono-label mb-3 flex items-center gap-2">
                <span aria-hidden className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
                Previous
              </div>
              <div className="text-lg sm:text-xl font-semibold tracking-tight text-fg group-hover:text-accent transition-colors line-clamp-2">
                {prev.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="group p-8 sm:p-12 sm:text-right transition-colors hover:bg-white/[0.012]"
            >
              <div className="mono-label mb-3 flex sm:justify-end items-center gap-2">
                Next
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </div>
              <div className="text-lg sm:text-xl font-semibold tracking-tight text-fg group-hover:text-accent transition-colors line-clamp-2">
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

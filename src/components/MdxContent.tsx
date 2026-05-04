import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

interface MdxContentProps {
  source: string;
}

const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="text-3xl sm:text-4xl font-semibold text-fg mt-16 mb-5 tracking-tight"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-2xl sm:text-3xl font-semibold text-fg mt-14 mb-4 tracking-tight scroll-mt-24"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-xl sm:text-2xl font-semibold text-fg mt-10 mb-3 tracking-tight scroll-mt-24"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="leading-[1.75] text-base sm:text-lg text-fg-muted mb-6"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc pl-6 space-y-2.5 mb-6 text-fg-muted marker:text-fg-faint"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal pl-6 space-y-2.5 mb-6 text-fg-muted marker:text-fg-faint marker:font-mono"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-[1.75] text-base sm:text-lg pl-1" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-accent hover:text-[var(--accent-hover)] underline underline-offset-4 decoration-from-font transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-fg font-semibold" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-fg" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-white/[0.04] border border-subtle px-1.5 py-0.5 text-[0.92em] font-mono text-fg rounded-md"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-[#0d0d0d] border border-subtle p-5 sm:p-6 overflow-x-auto mb-8 text-sm font-mono text-fg leading-relaxed rounded-xl"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-2 border-[color:var(--accent)] pl-6 italic text-fg my-8 py-2 text-lg sm:text-xl leading-relaxed"
      {...props}
    />
  ),
  hr: () => <hr className="border-subtle my-12" />,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img className="rounded-xl border border-subtle my-8 w-full" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-8 rounded-xl border border-subtle">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="text-left text-xs uppercase tracking-wider font-semibold text-fg-muted px-4 py-3 border-b border-subtle bg-white/[0.02]"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-4 py-3 border-b border-subtle text-fg-muted"
      {...props}
    />
  ),
};

export default function MdxContent({ source }: MdxContentProps) {
  return (
    <article className="max-w-2xl">
      <MDXRemote
        source={source}
        components={components}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </article>
  );
}

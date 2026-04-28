import Link from "next/link";

const socials = [
  { label: "GitHub", href: "https://github.com/yourusername" },
  { label: "LinkedIn", href: "https://linkedin.com/in/yourusername" },
  { label: "Twitter", href: "https://twitter.com/yourusername" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/20 text-sm">
          © {new Date().getFullYear()}{" "}
          <Link href="/" className="text-white/35 hover:text-white transition-colors duration-300">
            KENTO_O
          </Link>
        </p>

        <div className="flex items-center gap-6">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-xs uppercase tracking-widest font-medium"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

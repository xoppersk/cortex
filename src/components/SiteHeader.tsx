import Link from "next/link";
import { ButtonLink } from "./Button";

const links = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs/citations", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-wrap site-header">
      <Link href="/" className="wordmark">
        Cortex
      </Link>
      <nav aria-label="Main" className="site-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-link"
            aria-current={current === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="row">
        <Link href="/login" className="text-link">
          Sign in
        </Link>
        <ButtonLink href="/signup" variant="primary" size="md">
          Start free
        </ButtonLink>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-wrap site-footer">
      <span className="wordmark" style={{ fontSize: 17 }}>Cortex</span>
      <nav aria-label="Footer" className="site-nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-link" style={{ fontSize: 13 }}>
            {link.label}
          </Link>
        ))}
        <a href="#" className="text-link" style={{ fontSize: 13 }}>
          Security
        </a>
        <a href="#" className="text-link" style={{ fontSize: 13 }}>
          Privacy
        </a>
      </nav>
      <span>© 2026 [Company]</span>
    </footer>
  );
}

import Link from "next/link";
import type { CSSProperties } from "react";
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
      <div className="row" style={{ gap: 18 }}>
        <Link href="/login" className="text-link">
          Sign in
        </Link>
        <ButtonLink href="/app/new" variant="primary" size="md" style={{ fontSize: 14 }}>
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

/*
 * LegalFooter (brief §7): one line on auth and standalone screens
 * (Login, Signup, Invite, Upgrade, 404) — © 2026 [Company] left;
 * Privacy / Terms / Security / Status / Help right; 1px --rule top border.
 * Help reaches Docs (/docs/citations) as the designs specify; the other
 * items keep the designs' "#" placeholders. (The Login canvas shows only
 * Privacy / Terms / Status; brief §7's five-item set wins per fix item 8.)
 */
const legalItems: Array<{ label: string; href: string }> = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Security", href: "#" },
  { label: "Status", href: "#" },
  { label: "Help", href: "/docs/citations" },
];

export function LegalFooter({
  items = legalItems,
  style,
}: {
  items?: Array<{ label: string; href: string }>;
  style?: CSSProperties;
}) {
  return (
    <footer
      style={{
        padding: "18px 48px 24px",
        borderTop: "1px solid var(--rule)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        color: "var(--ink-3)",
        ...style,
      }}
    >
      <span>© 2026 [Company]</span>
      <nav aria-label="Legal" style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        {items.map((item) =>
          item.href.startsWith("/") ? (
            <Link key={item.label} href={item.href} style={{ color: "var(--ink-3)" }}>
              {item.label}
            </Link>
          ) : (
            <a key={item.label} href={item.href} style={{ color: "var(--ink-3)" }}>
              {item.label}
            </a>
          ),
        )}
      </nav>
    </footer>
  );
}

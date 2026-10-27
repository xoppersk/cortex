import Link from "next/link";
import type { CSSProperties } from "react";

const links = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs/citations", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className="brand" aria-hidden="true">
      <i style={small ? { width: 24, height: 24, fontSize: 13 } : undefined}>C</i>
      <b style={small ? { fontSize: 17 } : undefined}>Cortex</b>
    </span>
  );
}

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="wrap mh">
      <Link href="/" className="brand" aria-label="Cortex home">
        <i aria-hidden="true">C</i>
        <b>Cortex</b>
      </Link>
      <nav aria-label="Main" className="mnav">
        {links.map((link) => (
          <Link key={link.href} href={link.href} aria-current={current === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Link href="/login" className="tl">
          Sign in
        </Link>
        <Link href="/app/new" className="btn dk" style={{ height: 36, padding: "0 14px", fontSize: 14 }}>
          Start free
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="wrap foot" style={{ paddingTop: 36, paddingBottom: 44 }}>
      <span className="brand">
        <i aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 8, fontSize: 13 }}>
          C
        </i>
        <b style={{ fontSize: 17 }}>Cortex</b>
      </span>
      <nav aria-label="Footer">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <a href="#">Security</a>
        <a href="#">Privacy</a>
      </nav>
      <span>© 2026 Sevyn Labs · <a href="tel:+12762702729">(276) 270-2729</a></span>
    </footer>
  );
}

/*
 * LegalFooter (brief §7): one line on auth and standalone screens
 * (Login, Signup, Invite, Upgrade, 404) — © 2026 Sevyn Labs and the company phone left;
 * Privacy / Terms / Security / Status / Help right; 1px top border in the
 * ring colour #E4E4E0 (var(--ring-line)), as the screens compute it. The
 * © line renders in --ink-3; the links render in --ink-2, per the screens.
 * Help reaches Docs (/docs/citations) as the designs specify; the other
 * items keep the designs' "#" placeholders.
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
        borderTop: "1px solid var(--ring-line)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        color: "var(--ink-3)",
        ...style,
      }}
    >
      <span>© 2026 Sevyn Labs · <a href="tel:+12762702729">(276) 270-2729</a></span>
      <nav aria-label="Legal" style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        {items.map((item) =>
          item.href.startsWith("/") ? (
            <Link key={item.label} href={item.href} style={{ color: "var(--ink-2)" }}>
              {item.label}
            </Link>
          ) : (
            <a key={item.label} href={item.href} style={{ color: "var(--ink-2)" }}>
              {item.label}
            </a>
          ),
        )}
      </nav>
    </footer>
  );
}

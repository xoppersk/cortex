import Link from "next/link";
import type { CSSProperties } from "react";
import { ButtonLink } from "./Button";

const links = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs/citations", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

/* The C monogram + wordmark used on every public and system screen. */
export function SiteBrand({ small = false, style }: { small?: boolean; style?: CSSProperties }) {
  return (
    <Link href="/" className="pv-site-brand" aria-label="Cortex home" style={style}>
      <i aria-hidden="true" style={small ? { width: 24, height: 24, fontSize: 13 } : undefined}>
        C
      </i>
      <b style={small ? { fontSize: 17 } : undefined}>Cortex</b>
    </Link>
  );
}

/*
 * Public site header (Premium v2): monogram brand, pill navigation (the
 * current page is a white card on a hairline ring), Sign in + Start free.
 */
export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="pm-wrap pm-head">
      <SiteBrand />
      <nav aria-label="Main" className="pm-nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href} aria-current={current === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="pm-head-actions">
        <Link href="/login" className="pm-tl">
          Sign in
        </Link>
        <ButtonLink href="/app/new" variant="primary" className="pm-btn-head">
          Start free
        </ButtonLink>
      </div>
    </header>
  );
}

export function SiteFooter({ wrapClass = "pm-wrap" }: { wrapClass?: string }) {
  return (
    <footer className={`${wrapClass} pm-foot`}>
      <SiteBrand small />
      <nav aria-label="Footer">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <a href="#">Security</a>
        <a href="#">Privacy</a>
      </nav>
      <span>© 2026 Sevyn Labs</span>
    </footer>
  );
}

/*
 * LegalFooter: one line on auth and standalone screens (Login, Signup,
 * Invite, Upgrade, 404) — © 2026 Sevyn Labs left; Privacy / Terms / Security /
 * Status / Help right on a hairline. Help reaches Docs; the other items keep
 * the designs' "#" placeholders. Login passes its shorter set.
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
    <footer className="pm-foot pm-legal" style={style}>
      <span>© 2026 Sevyn Labs</span>
      <nav aria-label="Legal">
        {items.map((item) =>
          item.href.startsWith("/") ? (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ) : (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ),
        )}
      </nav>
    </footer>
  );
}

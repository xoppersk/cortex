import Link from "next/link";
import { LegalFooter } from "../components/SiteHeader";
import NotFoundTitle from "./not-found-title";

/*
 * S-09 NotFound, per screens/NotFound.html: standalone header → centred
 * content row (message column beside a "Where to go" nav) → LegalFooter.
 */
const suggestions: Array<{ label: string; detail: string; href: string }> = [
  { label: "Launch narrative", detail: "conversation", href: "/app/c/launch-narrative" },
  { label: "All conversations", detail: "24", href: "/app/history" },
  { label: "Docs", detail: "help", href: "/docs/citations" },
];

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NotFoundTitle />
      <header style={{ padding: "28px 48px" }}>
        <Link href="/" className="wordmark" style={{ fontSize: 22 }}>
          Cortex
        </Link>
      </header>

      <div
        style={{
          flex: 1,
          padding: "64px 48px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 72,
        }}
      >
        <div
          style={{
            flex: "1 1 460px",
            maxWidth: 580,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--ink-4)" }}>404 · nothing at this address</span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 48,
              lineHeight: 1.08,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
            }}
          >
            We can&rsquo;t cite this page. It isn&rsquo;t in the catalog.
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 19,
              lineHeight: 1.6,
              fontWeight: 400,
              color: "var(--ink-body)",
            }}
          >
            The link may be old, or the conversation may have been deleted or never shared with you.
            If someone sent it, ask them to share it with your account.
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink-3)",
            }}
          >
            cortex.app/sevyn-labs/c/launch-narrative-v1
          </p>
        </div>

        <nav
          aria-label="Where to go"
          style={{
            flex: "1 1 280px",
            maxWidth: 340,
            paddingTop: 34,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--ink-4)", paddingBottom: 8 }}>Did you mean</span>
          {suggestions.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 12,
                padding: "12px 0",
                borderTop: "1px solid var(--rule)",
                borderBottom:
                  index === suggestions.length - 1 ? "1px solid var(--rule)" : undefined,
                fontSize: 15,
                textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{item.detail}</span>
            </Link>
          ))}
          <span style={{ marginTop: 18, fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)" }}>
            Something broke instead? <a href="#">Tell us</a> and include reference{" "}
            <span style={{ fontFamily: "var(--font-mono)" }}>7Q2-41K</span>.
          </span>
        </nav>
      </div>

      <LegalFooter />
    </div>
  );
}

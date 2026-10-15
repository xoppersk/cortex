import Link from "next/link";
import { Icon, type IconName } from "../components/Icon";
import { LegalFooter, SiteBrand } from "../components/SiteHeader";
import NotFoundTitle from "./not-found-title";

/*
 * NotFound (Premium v2): ground page, the 404 message with the broken
 * address on a dashed chip, and a lifted "Did you mean" sheet.
 */
const suggestions: Array<{ label: string; detail: string; href: string; icon: IconName; mono?: boolean }> = [
  { label: "Launch narrative", detail: "conversation", href: "/app/c/launch-narrative", icon: "chat" },
  { label: "All conversations", detail: "24", href: "/app/history", icon: "menu", mono: true },
  { label: "Docs", detail: "help", href: "/docs/citations", icon: "file" },
];

export default function NotFound() {
  return (
    <div className="pm-page">
      <NotFoundTitle />
      <header className="pm-sys-head">
        <SiteBrand />
      </header>

      <main className="pm-sys-body pm-404">
        <div className="pm-404-main">
          <span className="pv-tag pv-tag-ln" style={{ height: 24, padding: "0 9px", fontSize: 12.5 }}>
            <span className="pv-mono" style={{ fontWeight: 500 }}>
              404
            </span>{" "}
            · nothing at this address
          </span>
          <h1>We can&rsquo;t cite this page. It isn&rsquo;t in the catalog.</h1>
          <p className="pm-404-body">
            The link may be old, or the conversation may have been deleted or never shared with you. If someone sent it, ask
            them to share it with your account.
          </p>
          <p className="pm-404-url">
            <Icon name="unlink" size={14} />
            cortex.app/sevyn-labs/c/launch-narrative-v1
          </p>
        </div>

        <nav aria-labelledby="did-you-mean" className="pm-sheet pm-lift pm-404-nav">
          <span className="pv-lbl" id="did-you-mean" style={{ fontSize: 11.5, padding: "20px 16px 14px" }}>
            Did you mean
          </span>
          {suggestions.map((item) => (
            <Link key={item.label} href={item.href} className="pm-lk">
              <span className="pm-ib" aria-hidden="true">
                <Icon name={item.icon} />
              </span>
              <span style={{ fontWeight: 500 }}>{item.label}</span>
              <span className={item.mono ? "pv-mono" : undefined} style={{ fontSize: 13, color: "var(--ink-3)" }}>
                {item.detail}
              </span>
            </Link>
          ))}
          <span className="pm-404-foot">
            Something broke instead? <a href="#">Tell us</a> and include reference{" "}
            <span className="pv-mono" style={{ color: "var(--ink)" }}>
              7Q2-41K
            </span>
            .
          </span>
        </nav>
      </main>

      <LegalFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "../components/SiteHeader";
import { IconChat } from "../components/icons";

/*
 * The root not-found file supports a metadata export in this Next version
 * (see node_modules/next/dist/docs …/file-conventions/not-found.md), so the
 * designed title ships in the server-rendered HTML. `absolute` bypasses the
 * root layout's "%s · Cortex" template, matching the other standalone
 * screens (Login, Signup). The previous client-side useEffect setter never
 * took effect in the production build and has been removed.
 */
export const metadata: Metadata = { title: { absolute: "Cortex — Page not found" } };

/*
 * S-09 NotFound, per screens/NotFound.html (v2): standalone header →
 * centred content row (message column beside the "Did you mean"
 * .sheet.lift nav) → LegalFooter. The broken URL sits in a dashed-border
 * mono pill; the nav footer carries the reference code.
 */
const suggestions: Array<{
  label: string;
  detail: string;
  href: string;
  mono?: boolean;
  icon: "chat" | "list" | "doc";
}> = [
  { label: "Launch narrative", detail: "conversation", href: "/app/c/launch-narrative", icon: "chat" },
  { label: "All conversations", detail: "24", href: "/app/history", mono: true, icon: "list" },
  { label: "Docs", detail: "help", href: "/docs/citations", icon: "doc" },
];

function SuggestionIcon({ icon }: { icon: "chat" | "list" | "doc" }) {
  if (icon === "chat") {
    return <IconChat style={{ width: 15, height: 15 }} />;
  }
  if (icon === "list") {
    return (
      <svg
        className="ic"
        viewBox="0 0 16 16"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ width: 15, height: 15 }}
      >
        <path d="M3 4h10M3 8h10M3 12h6" />
      </svg>
    );
  }
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 15, height: 15 }}
    >
      <path d="M4 2.5h5l3 3v8H4z" />
      <path d="M9 2.5v3h3" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
      </header>

      <div className="sys-404-main">
        <div className="sys-404-left">
          <span className="tag ln sys-404-tag">
            <span className="mono">404</span> · nothing at this address
          </span>
          <h1 className="sys-404-title">We can&rsquo;t cite this page. It isn&rsquo;t in the catalog.</h1>
          <p className="sys-404-body">
            The link may be old, or the conversation may have been deleted or never shared with you.
            If someone sent it, ask them to share it with your account.
          </p>
          <p className="sys-404-url">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ width: 14, height: 14, flex: "none" }}
            >
              <path d="M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8" />
              <path d="M2.5 2.5l2 2M13.5 13.5l-2-2" />
            </svg>
            <span className="sys-404-url-text">cortex.app/sevyn-labs/c/launch-narrative-v1</span>
          </p>
        </div>

        <nav aria-label="Where to go" className="sheet lift sys-404-nav">
          <span className="lbl sys-404-nav-title">Did you mean</span>
          {suggestions.map((item) => (
            <Link key={item.label} href={item.href} className="sys-lk">
              <span className="ib">
                <SuggestionIcon icon={item.icon} />
              </span>
              <span className="sys-lk-label">{item.label}</span>
              <span className={item.mono ? "sys-lk-detail mono" : "sys-lk-detail"}>{item.detail}</span>
            </Link>
          ))}
          <span className="sys-404-nav-foot">
            Something broke instead? <a href="#">Tell us</a> and include reference{" "}
            <span className="mono">7Q2-41K</span>.
          </span>
        </nav>
      </div>

      <LegalFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { IconArrowRight } from "../../components/icons";
import { LegalFooter } from "../../components/SiteHeader";
import { getStates, getWorkspaceData } from "../../lib/api";

export const metadata: Metadata = { title: { absolute: "Cortex — Sign in" } };

/*
 * S-01 Login, per screens/Login.html (v2): split layout on the rail ground.
 * Left section (flex 1 1 520px, padding 22px 48px 24px, column flex):
 * brand pinned at top, the .sheet.lift sign-in card vertically centred in
 * a flex:1 middle band, the two-step note and a short LegalFooter (only
 * Privacy / Terms / Status, as the screen shows) pinned at the bottom.
 * Right aside: dark ink panel (radius 16, 10px inset) with the footnoted
 * quote as a figure/figcaption — citation pill in --highlight, margin-style
 * source note under a #3A3A38 hairline. The design's sign-in is email-link
 * based — there is no password field. Google/SSO are auth action buttons
 * (type="button" in the design), not links into the app.
 */
export default function LoginPage() {
  const { auth } = getStates();
  const { currentUser } = getWorkspaceData();
  const quoteText = auth.quote.segments.map((segment) => segment.text).join("");

  return (
    <main className="sys-page">
      <div className="sys-login-wrap">
        <section className="sys-login-left">
          <Link href="/" className="brand sys-brand-start" aria-label="Cortex home">
            <i aria-hidden="true">C</i>
            <b>Cortex</b>
          </Link>
          <div className="sys-login-mid">
            <form action="/app/new" method="get" className="sheet lift sys-login-form">
              <h1 className="sys-login-title">Sign in</h1>
              <Button type="button" variant="secondary" size="lg" className="sys-btn-block">
                Continue with Google
              </Button>
              <Button type="button" variant="secondary" size="lg" className="sys-btn-block">
                <svg
                  className="ic"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ color: "var(--ink)" }}
                >
                  <circle cx="5.5" cy="10.5" r="2.5" />
                  <path d="m7.3 8.7 5.2-5.2M10.5 5.5l1.5 1.5" />
                </svg>
                Continue with single sign-on
              </Button>
              <div className="or sys-login-or">or with email</div>
              <Field label="Work email" htmlFor="login-email">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="inp lg"
                  defaultValue={currentUser.email}
                />
              </Field>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="sys-btn-block sys-login-submit"
              >
                Email me a sign-in link{" "}
                <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
              </Button>
              <p className="sys-login-new">
                New to Cortex? <Link href="/signup">Start a free trial</Link>
              </p>
            </form>
          </div>
          <span className="sys-login-twostep">
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
              style={{ width: 14, height: 14 }}
            >
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            Your workspace admin requires two-step verification after this step.
          </span>
          <LegalFooter
            items={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Status", href: "#" },
            ]}
            style={{ padding: "16px 0 0", gap: 12, borderTop: "1px solid var(--ring-line)" }}
          />
        </section>

        <aside aria-label="From a recent answer" className="sys-login-aside">
          <figure className="sys-login-figure">
            <blockquote className="sys-login-quote">
              {quoteText}
              <span className="cite sys-login-cite">1</span>
            </blockquote>
            <figcaption className="sys-login-caption">
              <b className="cite sys-login-caption-cite">1</b>
              <span>{auth.quote.source}</span>
            </figcaption>
          </figure>
        </aside>
      </div>
    </main>
  );
}

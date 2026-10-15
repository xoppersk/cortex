import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { LegalFooter, SiteBrand } from "../../components/SiteHeader";
import { getStates, getWorkspaceData } from "../../lib/api";

export const metadata: Metadata = { title: { absolute: "Cortex — Sign in" } };

/*
 * Login (Premium v2): ground page with the monogram brand, a lifted white
 * sign-in card, the two-step note and legal line; the right side is an ink
 * panel with the footnoted quote. Sign-in is email-link based (no password).
 * Google/SSO are auth action buttons, not links into the app.
 */
export default function LoginPage() {
  const { auth } = getStates();
  const { currentUser } = getWorkspaceData();
  const quoteText = auth.quote.segments.map((segment) => segment.text).join("");

  return (
    <div className="pm-page">
      <main className="pm-auth">
        <section className="pm-auth-main">
          <SiteBrand style={{ alignSelf: "flex-start" }} />
          <div className="pm-auth-center">
            <form action="/app/new" method="get" className="pm-sheet pm-lift pm-card-form">
              <h1>Sign in</h1>
              <Button type="button" variant="secondary" className="pm-btn-xl pm-btn-full">
                Continue with Google
              </Button>
              <Button type="button" variant="secondary" className="pm-btn-xl pm-btn-full">
                <Icon name="key" style={{ color: "var(--ink)" }} />
                Continue with single sign-on
              </Button>
              <div className="pm-or" style={{ margin: "6px 0" }}>
                or with email
              </div>
              <div className="pm-field">
                <label htmlFor="login-email">Work email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="pv-inp pm-inp-lg"
                  defaultValue={currentUser.email}
                />
              </div>
              <Button type="submit" variant="primary" className="pm-btn-xl pm-btn-full" style={{ marginTop: 4 }}>
                Email me a sign-in link
                <Icon name="arrowRight" size={15} style={{ color: "currentColor" }} />
              </Button>
              <p className="pm-small" style={{ marginTop: 6 }}>
                New to Cortex? <Link href="/signup">Start a free trial</Link>
              </p>
            </form>
          </div>
          <span className="pm-auth-note">
            <Icon name="lock" size={14} />
            Your workspace admin requires two-step verification after this step.
          </span>
          <LegalFooter
            items={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Status", href: "#" },
            ]}
            style={{ padding: "16px 0 0", gap: 12 }}
          />
        </section>

        <aside aria-label="From a recent answer" className="pm-auth-quote">
          <figure>
            <blockquote>
              {quoteText}
              <span className="pm-cite-hl" aria-label="footnote 1">
                1
              </span>
            </blockquote>
            <figcaption>
              <b className="pm-cite-dk">1</b>
              <span>{auth.quote.source}</span>
            </figcaption>
          </figure>
        </aside>
      </main>
    </div>
  );
}

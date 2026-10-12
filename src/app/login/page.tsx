import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { LegalFooter } from "../../components/SiteHeader";
import { getStates, getWorkspaceData } from "../../lib/api";

export const metadata: Metadata = { title: { absolute: "Cortex — Sign in" } };

/*
 * S-01 Login, per screens/Login.html: two-panel flex-wrap row. Left section
 * (flex 1 1 520px, padding 28px 48px 48px, column flex): wordmark pinned at
 * top, form vertically centred in a flex:1 middle band, two-step note and
 * LegalFooter pinned at the bottom. Right aside: tint panel with the
 * footnoted quote as a figure/figcaption. The design's sign-in is
 * email-link based — there is no password field. Google/SSO are auth
 * action buttons (type="button" in the design), not links into the app.
 */
export default function LoginPage() {
  const { auth } = getStates();
  const { currentUser } = getWorkspaceData();
  const quoteText = auth.quote.segments.map((segment) => segment.text).join("");

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap", background: "var(--paper)" }}>
      <section
        style={{
          flex: "1 1 520px",
          boxSizing: "border-box",
          padding: "28px 48px 48px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Link href="/" className="wordmark" style={{ fontSize: 22 }}>
          Cortex
        </Link>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <form
            action="/app/new"
            method="get"
            style={{
              width: "100%",
              maxWidth: 380,
              margin: "64px auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h1
              style={{
                margin: "0 0 6px",
                fontFamily: "var(--font-serif)",
                fontSize: 36,
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              Sign in
            </h1>
            <Button type="button" variant="secondary" size="lg" className="btn-block">
              Continue with Google
            </Button>
            <Button type="button" variant="secondary" size="lg" className="btn-block">
              Continue with single sign-on
            </Button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 13,
                color: "var(--ink-4)",
              }}
            >
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
              or with email
              <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
            </div>
            <Field label="Work email" htmlFor="login-email">
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className="field-control field-control-44"
                defaultValue={currentUser.email}
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" className="btn-block">
              Email me a sign-in link
            </Button>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)" }}>
              New to Cortex?{" "}
              <Link href="/signup" style={{ color: "var(--ink)" }}>
                Start a free trial
              </Link>
            </p>
          </form>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
          Your workspace admin requires two-step verification after this step.
        </span>
        <LegalFooter style={{ padding: "18px 0 0" }} />
      </section>

      <aside
        aria-label="From a recent answer"
        style={{
          flex: "1 1 420px",
          boxSizing: "border-box",
          padding: 48,
          background: "var(--tint)",
          borderLeft: "1px solid var(--rule)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <figure
          style={{
            margin: "0 auto",
            maxWidth: 440,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <blockquote
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 26,
              lineHeight: 1.45,
              fontWeight: 400,
              color: "var(--ink)",
            }}
          >
            {quoteText}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
                verticalAlign: "super",
              }}
            >
              1
            </span>
          </blockquote>
          <figcaption
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink-2)",
              paddingTop: 14,
              borderTop: "1px solid #DCDCD7",
            }}
          >
            <b style={{ color: "var(--ink)" }}>1</b> {auth.quote.source}
          </figcaption>
        </figure>
      </aside>
    </main>
  );
}

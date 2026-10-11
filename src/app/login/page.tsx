import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "../../components/Button";
import { Field } from "../../components/Field";
import { RichSegments } from "../../components/Footnote";
import { getStates, getWorkspaceData } from "../../lib/api";

export const metadata: Metadata = { title: "Sign in" };

/* S-01 Login: split layout, sign-in options on the left, footnoted quote on the right. */
export default function LoginPage() {
  const { auth } = getStates();
  const { currentUser } = getWorkspaceData();

  return (
    <main className="auth-split">
      <div className="auth-form-side">
        <div className="stack-6" style={{ width: "100%", maxWidth: 380 }}>
          <Link href="/" className="wordmark">
            Cortex
          </Link>
          <h1 className="page-title">Sign in</h1>
          <div className="stack-3">
            <ButtonLink href="/app/new" variant="secondary" size="lg" className="btn-block">
              Continue with Google
            </ButtonLink>
            <ButtonLink href="/app/new" variant="secondary" size="lg" className="btn-block">
              Continue with single sign-on
            </ButtonLink>
          </div>
          <p className="ui-text muted-3" style={{ textAlign: "center" }} aria-hidden="true">
            or with email
          </p>
          <form className="stack-4" action="/app/new" method="get">
            <Field label="Work email" htmlFor="login-email">
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className="field-control"
                defaultValue={currentUser.email}
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" className="btn-block">
              Email me a sign-in link
            </Button>
          </form>
          <p className="ui-text muted-3">
            New to Cortex?{" "}
            <Link href="/signup" style={{ color: "var(--ink)" }}>
              Start a free trial
            </Link>
          </p>
          <p className="caption">Your workspace admin requires two-step verification after this step.</p>
          <p className="caption">© 2026 [Company] · Privacy · Terms · Status</p>
        </div>
      </div>

      <aside className="auth-quote-side" aria-label="What a Cortex answer looks like">
        <p className="answer-text" style={{ fontSize: 20, maxWidth: 520 }}>
          <RichSegments segments={auth.quote.segments} />
        </p>
        <p className="margin-note" id="note-1" tabIndex={-1} style={{ maxWidth: 320 }}>
          <span>
            <span className="margin-note-number">1</span>{" "}
            <span className="margin-note-title">{auth.quote.source}</span>
          </span>
        </p>
      </aside>
    </main>
  );
}

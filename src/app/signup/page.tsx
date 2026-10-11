import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "../../components/Button";
import { getStates } from "../../lib/api";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Start a 14-day trial" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function SignupInner({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { auth, signup } = getStates();
  const errorState = params.state === "error";

  return (
    <main className="auth-split">
      <div className="auth-form-side">
        <div className="stack-6" style={{ width: "100%", maxWidth: 380 }}>
          <div className="row-between">
            <Link href="/" className="wordmark">
              Cortex
            </Link>
            <p className="ui-text muted-3">
              Already have a workspace?{" "}
              <Link href="/login" style={{ color: "var(--ink)" }}>
                Sign in
              </Link>
            </p>
          </div>
          <div className="stack-2">
            <p className="caption">{signup.stepLabel}</p>
            <h1 className="page-title">Start a 14-day trial</h1>
          </div>
          <ButtonLink href="/app/new" variant="secondary" size="lg" className="btn-block">
            Sign up with Google
          </ButtonLink>
          <p className="ui-text muted-3" style={{ textAlign: "center" }} aria-hidden="true">
            or
          </p>
          <SignupForm
            signupError={auth.signupError}
            initialErrorState={errorState}
            errorName={signup.errorName}
            errorEmail={signup.errorEmail}
          />
          <p className="caption">{signup.legal}</p>
          <p className="caption">© 2026 [Company] · Privacy · Terms · Security · Status · Help</p>
        </div>
      </div>

      <aside className="auth-quote-side" aria-label="What the trial includes">
        <h2 className="section-label">In the trial</h2>
        <ul className="stack-3" style={{ listStyle: "none" }}>
          {auth.trialFacts.map((fact) => (
            <li key={fact} className="ui-text" style={{ fontSize: 14 }}>
              {fact}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}

export default function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={null}>
      <SignupInner searchParams={searchParams} />
    </Suspense>
  );
}

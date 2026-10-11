import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getStates } from "../../lib/api";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Start free" };

/*
 * S-02 Signup. The designed state is the personal-email error state:
 * ?state=error renders the form prefilled with daniel.okafor@gmail.com and
 * the fixture error showing. Without the param the form starts clean and
 * the same validation runs on submit, then on change.
 */
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function SignupInner({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { auth } = getStates();
  const errorState = params.state === "error";

  return (
    <main className="auth-split">
      <div className="auth-form-side">
        <div className="stack-6" style={{ width: "100%", maxWidth: 380 }}>
          <Link href="/" className="wordmark">
            Cortex
          </Link>
          <div className="stack-2">
            <h1 className="page-title">Start free for 14 days</h1>
            <p className="ui-text muted-3">Create a workspace for your team.</p>
          </div>
          <SignupForm signupError={auth.signupError} initialErrorState={errorState} />
          <p className="ui-text muted-3">
            Already have a workspace?{" "}
            <Link href="/login" style={{ color: "var(--ink)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <aside className="auth-quote-side" aria-label="What the trial includes">
        <h2 className="section-label">The trial</h2>
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

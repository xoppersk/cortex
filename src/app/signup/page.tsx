import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LegalFooter } from "../../components/SiteHeader";
import { getStates } from "../../lib/api";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Start a trial" } };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/* Bold lead-ins for the trial facts, verbatim prefixes of the fixture strings (design S-02). */
const factLeads = ["14 days", "$20 of model use", "Up to 3 people"];

async function SignupInner({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { auth, signup } = getStates();
  // The design screen is the personal-email error state, so it is the
  // default render; ?state=clean opts out (the old ?state=error is the same).
  const errorState = params.state !== "clean";

  const facts = auth.trialFacts.slice(0, 3);
  const closingFact = auth.trialFacts[3];

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
      <header
        style={{
          padding: "28px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link href="/" className="wordmark" style={{ fontSize: 22 }}>
          Cortex
        </Link>
        <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
          Already have a workspace?{" "}
          <Link href="/login" style={{ color: "var(--ink)" }}>
            Sign in
          </Link>
        </span>
      </header>

      <div
        style={{
          flex: 1,
          padding: "40px 48px 64px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 72,
        }}
      >
        <div style={{ flex: "1 1 360px", maxWidth: 400 }}>
          <SignupForm
            signupError={auth.signupError}
            initialErrorState={errorState}
            errorName={signup.errorName}
            errorEmail={signup.errorEmail}
          />
        </div>

        <aside
          aria-label="What the trial includes"
          style={{
            flex: "1 1 300px",
            maxWidth: 360,
            paddingTop: 34,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--ink-2)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 400, color: "var(--ink-4)" }}>
            In the trial
          </h2>
          {facts.map((fact, index) => {
            const lead = factLeads[index];
            const hasLead = lead && fact.startsWith(lead);
            return (
              <span key={fact}>
                {hasLead ? (
                  <>
                    <b style={{ color: "var(--ink)", fontWeight: 500 }}>{lead}</b>
                    {fact.slice(lead.length)}
                  </>
                ) : (
                  fact
                )}
              </span>
            );
          })}
          {closingFact ? (
            <span style={{ paddingTop: 14, borderTop: "1px solid var(--rule)" }}>{closingFact}</span>
          ) : null}
        </aside>
      </div>

      <LegalFooter />
    </div>
  );
}

export default function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={null}>
      <SignupInner searchParams={searchParams} />
    </Suspense>
  );
}

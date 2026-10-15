import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Icon, type IconName } from "../../components/Icon";
import { LegalFooter, SiteBrand } from "../../components/SiteHeader";
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

  const icons: IconName[] = ["clock", "check", "user"];

  return (
    <div className="pm-page">
      <header className="pm-sys-head">
        <SiteBrand />
        <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
          Already have a workspace?{" "}
          <Link href="/login" style={{ fontWeight: 500 }}>
            Sign in
          </Link>
        </span>
      </header>

      <main className="pm-sys-body">
        <div className="pm-sheet pm-lift" style={{ flex: "1 1 380px", maxWidth: 460, padding: 36 }}>
          <SignupForm
            signupError={auth.signupError}
            initialErrorState={errorState}
            errorName={signup.errorName}
            errorEmail={signup.errorEmail}
          />
        </div>

        <aside aria-labelledby="trial-heading" className="pm-sheet pm-trial">
          <h2 className="pv-lbl" id="trial-heading" style={{ fontSize: 11.5, paddingBottom: 2 }}>
            In the trial
          </h2>
          {facts.map((fact, index) => {
            const lead = factLeads[index];
            const hasLead = lead && fact.startsWith(lead);
            return (
              <span key={fact} className="pm-perk">
                <span className="pm-ib" aria-hidden="true">
                  <Icon name={icons[index] ?? "check"} />
                </span>
                <span>
                  {hasLead ? (
                    <>
                      <b>{lead}</b>
                      {fact.slice(lead.length)}
                    </>
                  ) : (
                    fact
                  )}
                </span>
              </span>
            );
          })}
          {closingFact ? <span className="pm-trial-note">{closingFact}</span> : null}
        </aside>
      </main>

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

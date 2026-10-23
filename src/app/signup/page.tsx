import type { Metadata } from "next";
import Link from "next/link";

import statesJson from "../../../data/states.json";
import { LegalFooter } from "../../components/SiteHeader";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Start a trial" } };

/* Bold lead-ins for the trial facts, verbatim prefixes of the fixture strings (design S-02). */
const factLeads = ["14 days", "$20 of model use", "Up to 3 people"];

/* Perk icons from screens/Signup.html: clock, check, person (15px strokes). */
const perkIcons = [
  <svg
    key="clock"
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
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3l2 1.5" />
  </svg>,
  <svg
    key="check"
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
    <path d="m3 8.5 3 3 7-7" />
  </svg>,
  <svg
    key="person"
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
    <circle cx="8" cy="5.5" r="2.5" />
    <path d="M3 13.5c.6-2.4 2.6-4 5-4s4.4 1.6 5 4" />
  </svg>,
];

/*
 * S-02 Signup, per screens/Signup.html (v2): header (brand + sign-in note)
 * → centred row: the .sheet.lift form card beside the "In the trial"
 * .sheet aside with icon perks and the closing inset note → LegalFooter.
 * The form itself (SignupForm) is wired to real Supabase sign-up; the
 * design's fake personal-email error state is gone.
 */
export default function SignupPage() {
  const { auth } = statesJson;
  const facts = auth.trialFacts.slice(0, 3);
  const closingFact = auth.trialFacts[3];

  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
        <span className="sys-topbar-note">
          Already have a workspace? <Link href="/login">Sign in</Link>
        </span>
      </header>

      <div className="sys-main">
        <SignupForm />

        <aside aria-label="What the trial includes" className="sheet sys-trial-aside">
          <h2 className="lbl sys-trial-title">In the trial</h2>
          {facts.map((fact, index) => {
            const lead = factLeads[index];
            const hasLead = lead && fact.startsWith(lead);
            return (
              <span key={fact} className="sys-perk">
                <span className="ib">{perkIcons[index]}</span>
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
          {closingFact ? <span className="sys-trial-note">{closingFact}</span> : null}
        </aside>
      </div>

      <LegalFooter />
    </div>
  );
}

import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { ButtonLink } from "../../components/Button";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = { title: "Pricing" };

/*
 * P-02 Pricing. Copy follows the canvas reference
 * (.canvas-ref/screens/P-02-pricing/body-clean.html) exactly.
 * Note: the canvas contains four FAQ entries, not five.
 */

const planHeading: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: 24,
  lineHeight: 1.2,
  fontWeight: 600,
  color: "var(--ink)",
};

const planPrice: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: 40,
  lineHeight: 1,
  fontWeight: 600,
  color: "var(--ink)",
};

const planList: CSSProperties = {
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 9,
  fontSize: 14,
  lineHeight: 1.45,
  color: "var(--ink-body)",
};

function Plan({
  featured = false,
  children,
}: {
  featured?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        flex: "1 1 300px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        paddingTop: 28,
        borderTop: featured ? "2px solid var(--ink)" : "1px solid var(--rule-strong)",
      }}
    >
      {children}
    </div>
  );
}

const comparisonRows: Array<[string, string, string, string]> = [
  ["Cited answers with margin sources", "Yes", "Yes", "Yes"],
  ["Retrieval trace and passage inspector", "Yes", "Yes", "Yes"],
  ["Spending limits", "Fixed at $20", "Per answer and per month", "Per team, answer and month"],
  ["Evidence kept", "30 days", "Up to 7 years", "Up to 10 years"],
  ["Audit log", "—", "1 year, CSV export", "Streamed to your SIEM"],
  ["Sign-in", "Email", "Email, Google, two-step", "SSO, SCIM"],
];

const faqs = [
  {
    question: "What happens when we hit the monthly limit?",
    answer:
      "New answers pause. Everyone can still read conversations, open sources and share. An admin can raise the limit for the rest of the cycle in one step.",
    open: true,
  },
  {
    question: "Do viewers need a seat?",
    answer:
      "No. Viewers read shared work and open its sources for free. A seat starts when someone becomes an Editor.",
    open: false,
  },
  {
    question: "What does “model use at cost” include?",
    answer:
      "The tokens Cortex reads from your sources and the tokens it writes, at the model provider’s price. We itemise it on every invoice.",
    open: false,
  },
  {
    question: "Can we pay by invoice?",
    answer: "Yes, on annual Team and all Enterprise plans.",
    open: false,
  },
];

const faqDetails: CSSProperties = { borderTop: "1px solid var(--rule)", padding: "18px 0" };
const faqSummary: CSSProperties = {
  cursor: "pointer",
  fontFamily: "var(--font-serif)",
  fontSize: 17,
  lineHeight: 1.35,
  fontWeight: 600,
  color: "var(--ink)",
};
const faqAnswer: CSSProperties = {
  marginTop: 10,
  fontSize: 15,
  lineHeight: 1.6,
  color: "var(--ink-2)",
  maxWidth: "40em",
};

export default function PricingPage() {
  return (
    <div>
      <SiteHeader current="/pricing" />

      <section className="site-wrap" style={{ paddingTop: 80, paddingBottom: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <h1 className="display-l" style={{ fontSize: 64, maxWidth: "14ch" }}>
            Pay for seats. Pay for answers at cost.
          </h1>
          <p className="serif-lead" style={{ fontSize: 21, maxWidth: "34em" }}>
            A flat price per person, plus the model use your team actually spends — with a ceiling you set,
            so the bill can’t surprise you.
          </p>
        </div>
      </section>

      <section aria-label="Plans" className="site-wrap" style={{ paddingBottom: 80 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
          <Plan>
            <h2 style={planHeading}>Trial</h2>
            <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
              <strong style={planPrice}>$0</strong> for 14 days
            </p>
            <ul style={planList}>
              <li>Up to 3 people</li>
              <li>$20 of model use included</li>
              <li>Two knowledge bases, 25 documents</li>
              <li>Everything in Team</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <ButtonLink href="/signup" variant="secondary" size="lg">
                Start the trial
              </ButtonLink>
            </div>
          </Plan>

          <Plan featured>
            <div className="row-between" style={{ alignItems: "baseline" }}>
              <h2 style={planHeading}>Team</h2>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Most teams</span>
            </div>
            <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
              <strong style={planPrice}>$30</strong> per seat a month, plus model use at cost
            </p>
            <ul style={planList}>
              <li>Unlimited knowledge bases and documents</li>
              <li>Playbooks with checks and versions</li>
              <li>Evaluations, nightly</li>
              <li>Per-answer and monthly spending limits</li>
              <li>Audit log kept one year</li>
              <li>Viewers are free</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <ButtonLink href="/signup" variant="primary" size="lg">
                Start with Team
              </ButtonLink>
            </div>
          </Plan>

          <Plan>
            <h2 style={planHeading}>Enterprise</h2>
            <p style={{ fontSize: 15, color: "var(--ink-2)" }}>
              <strong style={planPrice}>Annual</strong> contract
            </p>
            <ul style={planList}>
              <li>Single sign-on and SCIM</li>
              <li>Custom retention, up to 10 years</li>
              <li>Audit log streamed to your SIEM</li>
              <li>Data residency in the US or EU</li>
              <li>A named contact and a 99.9% uptime commitment</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <ButtonLink href="/signup" variant="secondary" size="lg">
                Talk to sales
              </ButtonLink>
            </div>
          </Plan>
        </div>
      </section>

      <section className="site-wrap marketing-section" style={{ paddingBottom: 72 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 56 }}>
          <div style={{ flex: "1 1 360px" }} className="stack-4">
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 36,
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                maxWidth: "14ch",
              }}
            >
              What a month actually costs
            </h2>
            <p className="answer-text" style={{ maxWidth: "30em" }}>
              A typical cited answer costs two to four cents. Here is a five-person research team asking
              about 60 questions each working day.
            </p>
          </div>
          <div style={{ flex: "1 1 420px", maxWidth: 520, fontSize: 15 }}>
            <div className="ledger">
              <div className="ledger-row" style={{ padding: "12px 0" }}>
                <span>5 seats × $30</span>
                <span className="ledger-row-value">$150</span>
              </div>
              <div className="ledger-row" style={{ padding: "12px 0" }}>
                <span>
                  About 1,300 answers × $0.03
                  <br />
                  <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
                    60 a day for 22 working days
                  </span>
                </span>
                <span className="ledger-row-value">$40</span>
              </div>
              <div className="ledger-row" style={{ padding: "12px 0" }}>
                <span>Indexing 30 new documents</span>
                <span className="ledger-row-value">$4</span>
              </div>
              <div
                className="ledger-row"
                style={{ padding: "12px 0", borderTop: "1px solid var(--ink)", fontWeight: 600 }}
              >
                <span>About</span>
                <span className="ledger-row-value">$194 a month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-wrap marketing-section" style={{ paddingBottom: 72 }}>
        <div className="stack-5">
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 36,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Compare plans
          </h2>
          <div className="table-scroll">
            <table className="data-table" aria-label="Plan comparison" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th scope="col">Trial</th>
                  <th scope="col">Team</th>
                  <th scope="col">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row[0]} style={{ fontSize: 14 }}>
                    <td style={{ color: "var(--ink)" }}>{row[0]}</td>
                    <td style={{ color: "var(--ink-2)" }}>{row[1]}</td>
                    <td style={{ color: "var(--ink-2)" }}>{row[2]}</td>
                    <td style={{ color: "var(--ink-2)" }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="site-wrap marketing-section" style={{ paddingBottom: 96 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 56 }}>
          <h2
            style={{
              flex: "1 1 280px",
              fontFamily: "var(--font-serif)",
              fontSize: 36,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Questions about the bill
          </h2>
          <div style={{ flex: "2 1 520px", maxWidth: 680 }}>
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={faq.open || undefined}
                style={{
                  ...faqDetails,
                  borderBottom: index === faqs.length - 1 ? "1px solid var(--rule)" : undefined,
                }}
              >
                <summary style={faqSummary}>{faq.question}</summary>
                <p style={faqAnswer}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="hairline-top">
        <SiteFooter />
      </div>
    </div>
  );
}

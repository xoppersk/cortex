import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck } from "../../components/icons";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = { title: { absolute: "Cortex — Pricing" } };

/*
 * P-02 Pricing — Premium v2 (screens/Pricing.html). Plan sheets, the worked
 * monthly example ($75 + $40 + $4 = $119), the comparison table and the
 * FAQ in <details>, copy transcribed verbatim from the screen.
 */

function PlanList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <IconCheck />
          {item}
        </li>
      ))}
    </ul>
  );
}

const comparisonRows: Array<{ label: string; cells: string[] }> = [
  { label: "Cited answers with margin sources", cells: ["Yes", "Yes", "Yes"] },
  { label: "Retrieval trace and passage inspector", cells: ["Yes", "Yes", "Yes"] },
  { label: "Spending limits", cells: ["Fixed at $20", "Per answer and per month", "Per team, answer and month"] },
  { label: "Evidence kept", cells: ["30 days", "Up to 7 years", "Up to 10 years"] },
  { label: "Audit log", cells: ["—", "1 year, CSV export", "Streamed to your SIEM"] },
  { label: "Sign-in", cells: ["Email", "Email, Google, two-step", "SSO, SCIM"] },
];

const yesCell = (text: string) => (
  <span className="pub-yes">
    <IconCheck />
    {text}
  </span>
);

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

export default function PricingPage() {
  return (
    <div>
      <SiteHeader current="/pricing" />

      <section className="wrap pub-pricing-hero">
        <h1 className="pub-pricing-h1">Pay for seats. Pay for answers at cost.</h1>
        <p className="lead pub-pricing-lead">
          A flat price per person, plus the model use your team actually spends — with a ceiling you set, so
          the bill can’t surprise you.
        </p>
      </section>

      <section aria-label="Plans" className="wrap pub-plans">
        <div className="sheet pub-plan">
          <h2>Trial</h2>
          <p className="pub-price">
            <b>$0</b> for 14 days
          </p>
          <PlanList
            items={[
              "Up to 3 people",
              "$20 of model use included",
              "Two knowledge bases, 25 documents",
              "Everything in Team",
            ]}
          />
          <Link href="/app/new" className="btn lg">
            Start the trial
          </Link>
        </div>

        <div className="sheet pub-plan pub-plan-featured">
          <div className="pub-plan-head">
            <h2>Team</h2>
            <span className="tag dk">Most teams</span>
          </div>
          <p className="pub-price">
            <b>$15</b> per seat a month, plus model use at cost
          </p>
          <PlanList
            items={[
              "Unlimited knowledge bases and documents",
              "Playbooks with checks and versions",
              "Evaluations, nightly",
              "Per-answer and monthly spending limits",
              "Audit log kept one year",
              "Viewers are free",
            ]}
          />
          <Link href="/app/new" className="btn dk lg">
            Start with Team
          </Link>
        </div>

        <div className="sheet pub-plan">
          <h2>Enterprise</h2>
          <p className="pub-price">
            <b>Annual</b> contract
          </p>
          <PlanList
            items={[
              "Single sign-on and SCIM",
              "Custom retention, up to 10 years",
              "Audit log streamed to your SIEM",
              "Data residency in the US or EU",
              "A named contact and a 99.9% uptime commitment",
            ]}
          />
          <a href="#" className="btn lg">
            Talk to sales
          </a>
        </div>
      </section>

      <div className="wrap pub-pricing-stack">
        <section className="sheet pub-example">
          <div className="pub-example-copy">
            <h2 className="pub-h2-38">What a month actually costs</h2>
            <p className="lead pub-example-lead">
              A typical cited answer costs two to four cents. Here is a five-person research team asking
              about 60 questions each working day.
            </p>
          </div>
          <div className="pub-frag">
            <div className="pub-rc">
              <span>5 seats × $15</span>
              <span>$75</span>
            </div>
            <div className="pub-rc">
              <span>
                About 1,300 answers × $0.03
                <br />
                <span className="pub-rc-sub">60 a day for 22 working days</span>
              </span>
              <span>$40</span>
            </div>
            <div className="pub-rc">
              <span>Indexing 30 new documents</span>
              <span>$4</span>
            </div>
            <div className="pub-rc pub-rc-total">
              <span>About</span>
              <span>$119 a month</span>
            </div>
          </div>
        </section>

        <section className="sheet pub-compare">
          <h2 className="pub-h2-38">Compare plans</h2>
          <div className="pub-compare-scroll">
            <div role="table" aria-label="Plan comparison" className="pub-compare-inner">
              <div role="row" className="pub-cr pub-cr-head">
                <span role="columnheader">
                  <span className="sr-only">Feature</span>
                </span>
                <span role="columnheader" className="th">
                  Trial
                </span>
                <span role="columnheader" className="th" style={{ color: "var(--ink)" }}>
                  Team
                </span>
                <span role="columnheader" className="th">
                  Enterprise
                </span>
              </div>
              {comparisonRows.map((row, rowIndex) => (
                <div
                  key={row.label}
                  role="row"
                  className={`pub-cr${rowIndex === comparisonRows.length - 1 ? " pub-cr-last" : ""}`}
                  style={rowIndex === 0 ? { borderTop: 0 } : undefined}
                >
                  <span role="cell">{row.label}</span>
                  {row.cells.map((cell, cellIndex) => (
                    <span key={cellIndex} role="cell">
                      {cell === "Yes" ? yesCell(cell) : cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sheet pub-faq-sheet">
          <h2 className="pub-h2-38">Questions about the bill</h2>
          <div className="pub-faq">
            {faqs.map((faq) => (
              <details key={faq.question} open={faq.open || undefined}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

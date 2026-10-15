import type { Metadata } from "next";
import { ButtonLink } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = { title: { absolute: "Cortex — Pricing" } };

/*
 * Pricing (Premium v2): three plan sheets (Team raised on an ink ring), a
 * worked monthly cost, the comparison table and the billing FAQ, each on a
 * white sheet over the ground. Trial CTAs point to /app/new; "Talk to
 * sales" keeps the design's "#" placeholder.
 */

const plans = [
  {
    name: "Trial",
    price: "$0",
    priceNote: "for 14 days",
    features: ["Up to 3 people", "$20 of model use included", "Two knowledge bases, 25 documents", "Everything in Team"],
    cta: "Start the trial",
    href: "/app/new",
  },
  {
    name: "Team",
    price: "$30",
    priceNote: "per seat a month, plus model use at cost",
    features: [
      "Unlimited knowledge bases and documents",
      "Playbooks with checks and versions",
      "Evaluations, nightly",
      "Per-answer and monthly spending limits",
      "Audit log kept one year",
      "Viewers are free",
    ],
    cta: "Start with Team",
    href: "/app/new",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Annual",
    priceNote: "contract",
    features: [
      "Single sign-on and SCIM",
      "Custom retention, up to 10 years",
      "Audit log streamed to your SIEM",
      "Data residency in the US or EU",
      "A named contact and a 99.9% uptime commitment",
    ],
    cta: "Talk to sales",
    href: "#",
  },
];

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

export default function PricingPage() {
  return (
    <div className="pm-page">
      <SiteHeader current="/pricing" />

      <main>
        <section className="pm-wrap pm-hero" style={{ paddingTop: 80, paddingBottom: 56, gap: 22 }}>
          <h1 className="pm-display" style={{ fontSize: 68, lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "14ch" }}>
            Pay for seats. Pay for answers at cost.
          </h1>
          <p className="pm-lead" style={{ fontSize: 21, lineHeight: 1.55, maxWidth: "34em" }}>
            A flat price per person, plus the model use your team actually spends — with a ceiling you set, so the bill
            can’t surprise you.
          </p>
        </section>

        <section aria-label="Plans" className="pm-wrap pm-plans" style={{ paddingBottom: 16, gap: 16 }}>
          {plans.map((plan) => (
            <div key={plan.name} className={plan.featured ? "pm-sheet pm-plan pm-plan-featured" : "pm-sheet pm-plan"}>
              <h2>
                {plan.name}
                {plan.featured ? <span className="pv-tag pv-tag-dk">Most teams</span> : null}
              </h2>
              <p className="pm-price">
                <b>{plan.price}</b> {plan.priceNote}
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Icon name="check" size={14} strokeWidth={1.8} />
                    {feature}
                  </li>
                ))}
              </ul>
              <ButtonLink href={plan.href} variant={plan.featured ? "primary" : "secondary"} className="pm-btn-xl">
                {plan.cta}
              </ButtonLink>
            </div>
          ))}
        </section>

        <div className="pm-wrap" style={{ paddingTop: 16, paddingBottom: 72, display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="pm-sheet pm-feat" style={{ padding: "52px 56px", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 540px)" }} aria-labelledby="month-heading">
            <div className="pm-feat-text" style={{ gap: 16 }}>
              <h2 className="pm-h2" id="month-heading" style={{ fontSize: 38, maxWidth: "14ch" }}>
                What a month actually costs
              </h2>
              <p className="pm-lead" style={{ fontSize: 18, maxWidth: "30em" }}>
                A typical cited answer costs two to four cents. Here is a five-person research team asking about 60 questions
                each working day.
              </p>
            </div>
            <div className="pm-inset" style={{ overflow: "hidden" }}>
              <div className="pm-rc" style={{ borderTop: 0 }}>
                <span>5 seats × $30</span>
                <span>$150</span>
              </div>
              <div className="pm-rc">
                <span>
                  About 1,300 answers × $0.03
                  <br />
                  <span style={{ fontSize: 13, color: "var(--ink-3)" }}>60 a day for 22 working days</span>
                </span>
                <span>$40</span>
              </div>
              <div className="pm-rc">
                <span>Indexing 30 new documents</span>
                <span>$4</span>
              </div>
              <div className="pm-rc pm-rc-total" style={{ borderTopWidth: 1.5 }}>
                <span>About</span>
                <span style={{ fontWeight: 500 }}>$194 a month</span>
              </div>
            </div>
          </section>

          <section className="pm-sheet" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }} aria-labelledby="compare-heading">
            <h2 className="pm-h2" id="compare-heading" style={{ fontSize: 38, padding: "44px 28px 24px" }}>
              Compare plans
            </h2>
            <div style={{ overflowX: "auto" }}>
              <div role="table" aria-labelledby="compare-heading" className="pm-compare">
                <div
                  role="row"
                  className="pm-cr pv-th"
                  style={{ background: "var(--side)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", paddingTop: 14, paddingBottom: 14 }}
                >
                  <span role="columnheader">
                    <span className="sr-only">Feature</span>
                  </span>
                  <span role="columnheader">Trial</span>
                  <span role="columnheader" style={{ color: "var(--ink)" }}>
                    Team
                  </span>
                  <span role="columnheader">Enterprise</span>
                </div>
                {comparisonRows.map((row, index) => (
                  <div
                    key={row[0]}
                    role="row"
                    className="pm-cr"
                    style={{ borderTop: index === 0 ? 0 : undefined, paddingBottom: index === comparisonRows.length - 1 ? 22 : undefined }}
                  >
                    {row.map((cell, cellIndex) =>
                      cellIndex > 0 && cell === "Yes" ? (
                        <span key={cellIndex} role="cell" className="pm-y">
                          <Icon name="check" size={13} strokeWidth={1.8} style={{ color: "var(--ink)" }} />
                          Yes
                        </span>
                      ) : (
                        <span key={cellIndex} role="cell">
                          {cell}
                        </span>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="pm-sheet pm-feat pm-faq" style={{ padding: "48px 56px", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 680px)", gap: 56, alignItems: "start" }} aria-labelledby="faq-heading">
            <h2 className="pm-h2" id="faq-heading" style={{ fontSize: 38, maxWidth: "10ch" }}>
              Questions about the bill
            </h2>
            <div>
              {faqs.map((faq, index) => (
                <details key={faq.question} open={faq.open || undefined} style={index === faqs.length - 1 ? { paddingBottom: 0 } : undefined}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

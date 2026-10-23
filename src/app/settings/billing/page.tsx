import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { changePlanAction } from "../actions";

export const metadata: Metadata = { title: { absolute: "Cortex — Billing" } };

type Segment = { text: string; href?: string; bold?: boolean; strong?: boolean };

function renderSegments(segments: readonly Segment[]): ReactNode {
  return segments.map((segment, index) => {
    if (segment.href) {
      return (
        <Link key={index} href={segment.href} style={{ color: "var(--ink)" }}>
          {segment.text}
        </Link>
      );
    }
    if (segment.bold || segment.strong) {
      return (
        <strong key={index} style={{ fontWeight: 600 }}>
          {segment.text}
        </strong>
      );
    }
    return <span key={index}>{segment.text}</span>;
  });
}

/* The summary sentence marks the invoice date, as the screen shows it. */
function renderSummary(segments: readonly Segment[]): ReactNode {
  return segments.map((segment, index) =>
    segment.bold ? (
      <mark
        key={index}
        style={{ background: "var(--highlight)", color: "var(--ink)", padding: "0 3px", borderRadius: 3, fontWeight: 600 }}
      >
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

function CardIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth="1.6"
      aria-hidden="true"
      style={{ flex: "none", marginTop: size === 16 ? 2 : undefined }}
    >
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 6.5h13" />
    </svg>
  );
}

export default async function BillingPage() {
  const { billing } = await getAdminData();
  const { workspace } = await getWorkspaceData();

  const warningParts = billing.card.warning.split(". ");
  const warningLead = `${warningParts[0]}.`;
  const warningRest = warningParts.slice(1).join(". ");

  // "Visa ending 7731 · expires 10/26" — the expiry is highlighted on the card visual.
  const cardParts = billing.card.detail.split(" · expires ");
  const planSegments = billing.plan.bodySegments;
  const enterpriseIndex = planSegments.findIndex((segment) => segment.text === "Enterprise");

  return (
    <>
      <header className="ph ad-ph">
        <div className="ad-ph-left" style={{ maxWidth: 720 }}>
          <span className="sub">
            {workspace.name} <span className="sep">/</span> Settings
          </span>
          <h1>Billing</h1>
          <p className="ad-lede">{renderSummary(billing.summarySegments)}</p>
        </div>
      </header>

      <div className="ad-cols">
        <div className="ad-main ad-main-wide">
          <div role="alert" className="ad-warn-banner">
            <span className="ad-warn-text">
              <span style={{ color: "var(--warn)", display: "inline-flex" }}>
                <CardIcon />
              </span>
              <span>
                <b style={{ fontWeight: 600 }}>{warningLead}</b> {warningRest}
              </span>
            </span>
            <button type="button" className="btn dk">
              Update card
            </button>
          </div>

          <section aria-labelledby="next-invoice-heading" className="card" style={{ overflow: "hidden" }}>
            <div className="ad-hd">
              <h2 id="next-invoice-heading">{billing.nextInvoice.heading}</h2>
            </div>
            <div>
              {billing.nextInvoice.lines.map((line, index) => (
                <div key={line.label} className="ad-li" style={index === 0 ? { borderTop: 0 } : undefined}>
                  <span>
                    {line.label}
                    <span className="ad-li-meta">
                      {"detailSegments" in line && line.detailSegments
                        ? renderSegments(line.detailSegments)
                        : line.detail}
                    </span>
                  </span>
                  <span style={line.amount.startsWith("up to") ? { color: "var(--ink-3)", fontWeight: 400 } : undefined}>
                    {line.amount}
                  </span>
                </div>
              ))}
              <div className="ad-li ad-li-total">
                <span>{billing.nextInvoice.totalLabel}</span>
                <span>{billing.nextInvoice.total}</span>
              </div>
            </div>
          </section>

          <section aria-labelledby="past-invoices-heading" className="card" style={{ overflow: "hidden" }}>
            <div className="ad-hd">
              <h2 id="past-invoices-heading">Past invoices</h2>
            </div>
            <div className="table-scroll">
              <div role="table" aria-label="Past invoices">
                <div role="row" className="ad-ir ad-ir-head th">
                  <span role="columnheader">Date</span>
                  <span role="columnheader">Details</span>
                  <span role="columnheader" style={{ textAlign: "right" }}>
                    Amount
                  </span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">
                    <span className="sr-only">Download</span>
                  </span>
                </div>
                {billing.pastInvoices.map((invoice) => (
                  <div key={invoice.date} role="row" className="ad-ir">
                    <span role="cell">{invoice.date}</span>
                    <span role="cell" style={{ color: "var(--ink-2)" }}>
                      {invoice.details}
                    </span>
                    <span role="cell" className="mono" style={{ textAlign: "right" }}>
                      {invoice.amount}
                    </span>
                    <span role="cell">
                      <span className="tag" style={{ gap: 5 }}>
                        <svg
                          viewBox="0 0 16 16"
                          width="11"
                          height="11"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="m3 8.5 3 3 7-7" />
                        </svg>
                        {invoice.status}
                      </span>
                    </span>
                    <span role="cell" style={{ textAlign: "right" }}>
                      {/* Canvas placeholder (href="#"); no invoice file exists in this phase. */}
                      <a href="#" className="btn gh sm">
                        PDF
                      </a>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="ad-side">
          <section className="card ad-side-card" style={{ gap: 10 }} aria-label="Change plan">
            <h2 className="lbl">Change plan</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)" }}>
              Plan changes are recorded on the workspace as intent. No payment is taken — billing
              (Stripe) is not connected in this deployment.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["starter", "pro", "team"] as const).map((planOption) => (
                <form key={planOption} action={async () => { "use server"; await changePlanAction(planOption); }}>
                  <button type="submit" className="btn sm">
                    {planOption === "starter" ? "Starter" : planOption === "pro" ? "Pro" : "Team"}
                  </button>
                </form>
              ))}
            </div>
          </section>
          <h2 className="lbl" style={{ marginBottom: 2 }}>
            Paying with
          </h2>
          <section className="card ad-side-card" style={{ boxShadow: "var(--shadow-lift)" }} aria-label="Payment card">
            <div className="ad-card-visual">
              <svg
                viewBox="0 0 16 16"
                width="18"
                height="18"
                fill="none"
                stroke="#DCDCD7"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                <path d="M1.5 6.5h13" />
              </svg>
              <span className="ad-card-visual-text">
                {cardParts[0]} · <span style={{ color: "var(--highlight)" }}>expires {cardParts[1]}</span>
              </span>
            </div>
            <span>Receipts go to {billing.card.receiptsEmail}</span>
            {/* Canvas placeholder (href="#"); no billing-email screen exists in this phase. */}
            <a href="#">Change billing email</a>
          </section>

          <div className="ad-side-divider" aria-hidden="true" />

          <h2 className="lbl" style={{ marginBottom: 2 }}>
            {billing.plan.heading}
          </h2>
          <section className="card ad-side-card" style={{ gap: 10 }} aria-label="Current plan">
            <span className="ad-plan-part">
              <span className="tag dk" style={{ marginRight: 4 }}>
                {planSegments[0]!.text}
              </span>
              {planSegments.slice(1, enterpriseIndex).map((segment, index) => (
                <span key={index}>{segment.text.replace(/^ · /, " ")}</span>
              ))}
            </span>
            <span className="ad-plan-part">
              <span className="tag ln" style={{ marginRight: 4 }}>
                {planSegments[enterpriseIndex]!.text}
              </span>
              {planSegments.slice(enterpriseIndex + 1).map((segment, index) => (
                <span key={index}>{segment.text}</span>
              ))}
            </span>
            {/* Canvas placeholder (href="#"); sales contact is not a settings route. */}
            <a href="#">{billing.plan.actionLabel}</a>
          </section>
        </aside>
      </div>
    </>
  );
}


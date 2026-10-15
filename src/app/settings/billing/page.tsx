import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: { absolute: "Cortex — Billing" } };
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { SettingsHeader } from "../../../components/Shells";
import { getAdminData } from "../../../lib/api";

type Segment = { text: string; href?: string; bold?: boolean; strong?: boolean };

function renderSegments(segments: readonly Segment[]): ReactNode {
  return segments.map((segment, index) => {
    if (segment.href) {
      return (
        <Link key={index} href={segment.href}>
          {segment.text}
        </Link>
      );
    }
    if (segment.bold || segment.strong) {
      return (
        <strong key={index} style={{ fontWeight: segment.bold ? 600 : 500 }}>
          {segment.text}
        </strong>
      );
    }
    return <span key={index}>{segment.text}</span>;
  });
}

export default function BillingPage() {
  const { billing } = getAdminData();

  const warningParts = billing.card.warning.split(". ");
  const warningLead = `${warningParts[0]}.`;
  const warningRest = warningParts.slice(1).join(". ");
  const [cardName, cardExpiry] = billing.card.detail.split(" · ");
  const [planName, planRest] = splitPlan(billing.plan.bodySegments);

  return (
    <>
      <SettingsHeader
        title="Billing"
        width={720}
        lede={billing.summarySegments.map((segment, index) =>
          segment.bold ? (
            <mark key={index} className="pv-mark-key">
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      />

      <div className="pv-split">
        <div className="pv-set-main" style={{ gap: 20 }}>
          <div role="alert" className="pv-bill-alert">
            <span>
              <Icon name="card" strokeWidth={1.6} />
              <span>
                <b>{warningLead}</b> {warningRest}
              </span>
            </span>
            <Button variant="primary">Update card</Button>
          </div>

          <section aria-labelledby="next-invoice-heading" className="pv-card" style={{ overflow: "hidden" }}>
            <div className="pv-hd">
              <h2 id="next-invoice-heading">{billing.nextInvoice.heading}</h2>
            </div>
            {billing.nextInvoice.lines.map((line) => {
              const quiet = line.amount.startsWith("up to");
              return (
                <div key={line.label} className="pv-li">
                  <span>
                    {line.label}
                    <span className="pv-li-sub">
                      {"detailSegments" in line && line.detailSegments ? renderSegments(line.detailSegments) : line.detail}
                    </span>
                  </span>
                  <span className={quiet ? "pv-li-quiet" : undefined}>{line.amount}</span>
                </div>
              );
            })}
            <div className="pv-li pv-li-total">
              <span>{billing.nextInvoice.totalLabel}</span>
              <span>{billing.nextInvoice.total}</span>
            </div>
          </section>

          <section aria-labelledby="past-invoices-heading" className="pv-card" style={{ overflow: "hidden" }}>
            <div className="pv-hd">
              <h2 id="past-invoices-heading">Past invoices</h2>
            </div>
            <div role="table" aria-labelledby="past-invoices-heading" className="pv-rows">
              <div role="row" className="pv-row pv-row-head pv-ir pv-th pv-stack" style={{ fontSize: 11, background: "var(--paper)" }}>
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
                <div role="row" key={invoice.date} className="pv-row pv-ir pv-stack">
                  <span role="cell">{invoice.date}</span>
                  <span role="cell" style={{ color: "var(--ink-2)" }}>
                    {invoice.details}
                  </span>
                  <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
                    {invoice.amount}
                  </span>
                  <span role="cell">
                    <span className="pv-tag">
                      <Icon name="check" size={11} strokeWidth={2} style={{ color: "currentColor" }} />
                      {invoice.status}
                    </span>
                  </span>
                  <span role="cell" className="pv-row-actions">
                    {/* Fixture phase: no invoice files exist yet. */}
                    <a href="#" className="btn btn-quiet btn-sm" aria-label={`Download the ${invoice.date} invoice as PDF`}>
                      PDF
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="pv-side" aria-label="Payment and plan">
          <h2 className="pv-lbl pv-side-lbl">Paying with</h2>
          <section className="pv-card pv-card-lift">
            <div className="pv-paycard">
              <Icon name="card" size={18} strokeWidth={1.4} style={{ color: "#DCDCD7" }} />
              <span>
                {cardName} · <em>{cardExpiry}</em>
              </span>
            </div>
            <span>Receipts go to {billing.card.receiptsEmail}</span>
            {/* Canvas placeholder (href="#"); no billing-email screen exists in this phase. */}
            <a href="#">Change billing email</a>
          </section>
          <div className="pv-side-div" />
          <h2 className="pv-lbl pv-side-lbl">{billing.plan.heading}</h2>
          <section className="pv-card" style={{ gap: 10 }}>
            <span>
              <span className="pv-tag pv-tag-dk" style={{ marginRight: 4 }}>
                {planName.name}
              </span>
              {planName.rest}
            </span>
            <span className="pv-plan-more">
              <span className="pv-tag pv-tag-ln" style={{ marginRight: 4 }}>
                {planRest.name}
              </span>
              {planRest.rest}
            </span>
            {/* Canvas placeholder (href="#"); sales contact is not a settings route. */}
            <a href="#">{billing.plan.actionLabel}</a>
          </section>
        </aside>
      </div>
    </>
  );
}

/* "Team · $30 per seat…" + "Enterprise adds…" → two tagged sentences. */
function splitPlan(segments: readonly Segment[]): [{ name: string; rest: string }, { name: string; rest: string }] {
  const named = segments.filter((segment) => segment.strong || segment.bold);
  const restAfter = (name: string) => {
    const index = segments.findIndex((segment) => segment.text === name);
    return (segments[index + 1]?.text ?? "").replace(/^\s*·\s*/, " ").trim();
  };
  const first = named[0]?.text ?? "";
  const second = named[1]?.text ?? "";
  return [
    { name: first, rest: ` ${restAfter(first)}` },
    { name: second, rest: ` ${restAfter(second)}` },
  ];
}

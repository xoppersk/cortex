import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "../../../components/Button";
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

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Billing</h1>
        <p className="summary-sentence">{renderSegments(billing.summarySegments)}</p>
      </header>

      <section
        role="alert"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          flexWrap: "wrap",
          background: "var(--warn-tint)",
          border: "1px solid #E8D9A8",
          borderRadius: "var(--radius-m)",
          padding: "12px 16px",
          marginBottom: "var(--space-6)",
        }}
      >
        <p className="notice-body" style={{ flex: "1 1 420px" }}>
          <span style={{ color: "var(--warn)", fontWeight: 600 }}>{warningLead}</span> {warningRest}
        </p>
        <Button variant="primary" size="sm">
          Update card
        </Button>
      </section>

      <div className="doc-margin">
        <div className="doc-column">
          <section aria-labelledby="next-invoice-heading" className="stack-3">
            <h2 className="section-label" id="next-invoice-heading">
              {billing.nextInvoice.heading}
            </h2>
            <div>
              {billing.nextInvoice.lines.map((line) => (
                <div
                  key={line.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: "var(--space-4)",
                    padding: "10px 0",
                    borderTop: "1px solid var(--rule)",
                    fontSize: 14,
                    alignItems: "baseline",
                  }}
                >
                  <span>
                    <span style={{ color: "var(--ink-body)" }}>{line.label}</span>
                    <br />
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {"detailSegments" in line && line.detailSegments
                        ? renderSegments(line.detailSegments)
                        : line.detail}
                    </span>
                  </span>
                  <span style={{ color: "var(--ink)" }}>{line.amount}</span>
                </div>
              ))}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: "var(--space-4)",
                  padding: "10px 0",
                  borderTop: "1px solid var(--ink)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                <span>{billing.nextInvoice.totalLabel}</span>
                <span>{billing.nextInvoice.total}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box stack-3">
            <h2 className="margin-box-title">Paying with</h2>
            <p className="ui-text">
              {billing.card.detail}
              <br />
              <span className="muted-3">Receipts go to {billing.card.receiptsEmail}</span>
            </p>
            <p>
              {/* Canvas placeholder (href="#"); no billing-email screen exists in this phase. */}
              <a href="#">Change billing email</a>
            </p>
          </div>

          <div className="margin-box stack-3">
            <h2 className="margin-box-title">{billing.plan.heading}</h2>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
              {renderSegments(billing.plan.bodySegments)}
            </p>
            <p>
              {/* Canvas placeholder (href="#"); sales contact is not a settings route. */}
              <a href="#">{billing.plan.actionLabel}</a>
            </p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="past-invoices-heading" className="stack-3" style={{ maxWidth: "var(--column-doc)", marginTop: "var(--space-7)" }}>
        <h2 className="section-label" id="past-invoices-heading">
          Past invoices
        </h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Details</th>
                <th scope="col" className="numeric">
                  Amount
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Download</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {billing.pastInvoices.map((invoice) => (
                <tr key={invoice.date}>
                  <td>{invoice.date}</td>
                  <td>{invoice.details}</td>
                  <td className="numeric">{invoice.amount}</td>
                  <td>{invoice.status}</td>
                  <td>
                    <a href="#">PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

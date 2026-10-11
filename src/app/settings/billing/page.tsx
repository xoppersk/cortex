import Link from "next/link";
import { Button } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getAdminData } from "../../../lib/api";

export default function BillingPage() {
  const { billing } = getAdminData();

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Billing</h1>
        <p className="summary-sentence">{billing.summary}</p>
      </header>

      <div className="stack-6" style={{ maxWidth: "var(--column-doc)" }}>
        <section className="notice notice-warning stack-3">
          <p className="ui-text">{billing.card.warning}</p>
          <div>
            <Button variant="secondary" size="md">
              Update card
            </Button>
          </div>
        </section>

        <section aria-labelledby="next-invoice-heading" className="stack-3">
          <h2 className="section-label" id="next-invoice-heading" style={{ fontSize: 15 }}>
            {billing.nextInvoice.heading}
          </h2>
          <div className="ledger">
            {billing.nextInvoice.lines.map((line) => (
              <LedgerRow
                key={line.label}
                title={line.label}
                description={line.detail}
                value={line.amount}
              />
            ))}
            <LedgerRow featured title={billing.nextInvoice.totalLabel} value={billing.nextInvoice.total} />
          </div>
        </section>

        <section aria-labelledby="paying-heading" className="stack-3">
          <h2 className="section-label" id="paying-heading" style={{ fontSize: 15 }}>
            Paying with
          </h2>
          <p className="ui-text">
            {billing.card.detail}
            <br />
            <span className="muted-3">Receipts go to {billing.card.receiptsEmail}</span>
          </p>
          <p>
            <Link href="/settings/billing">Change billing email</Link>
          </p>
        </section>

        <section aria-labelledby="plan-heading" className="stack-3">
          <h2 className="section-label" id="plan-heading" style={{ fontSize: 15 }}>
            {billing.plan.heading}
          </h2>
          <p className="ui-text">{billing.plan.body}</p>
          <p>
            <Link href="/settings/billing">{billing.plan.actionLabel}</Link>
          </p>
        </section>

        <section aria-labelledby="past-invoices-heading" className="stack-3">
          <h2 className="section-label" id="past-invoices-heading" style={{ fontSize: 15 }}>
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
                      <Button variant="quiet" size="sm">
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

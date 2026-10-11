import { Button, ButtonLink } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { Notice } from "../../../components/Notice";
import { getAdminData } from "../../../lib/api";
import { formatMoney } from "../../../lib/utils";

export default function BillingPage() {
  const { billing } = getAdminData();

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Billing</h1>
        <p className="summary-sentence">{billing.rangeSentence}</p>
      </header>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <Notice variant="warning" headline="Update the card before October 31." lead="Card expiring">
            <p>{billing.card.warning}</p>
          </Notice>

          <section aria-labelledby="next-invoice-heading">
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h2 className="section-label" id="next-invoice-heading">
                Next invoice
              </h2>
              <span className="caption">Charged {billing.nextInvoice.date}</span>
            </div>
            <div className="ledger">
              {billing.nextInvoice.lines.map((line) => (
                <LedgerRow key={line.label} title={line.label} value={formatMoney(line.amount)} />
              ))}
              <LedgerRow featured title="Total" value={formatMoney(billing.nextInvoice.total)} />
            </div>
          </section>

          <section aria-labelledby="past-invoices-heading">
            <h2 className="section-label" id="past-invoices-heading" style={{ marginBottom: 8 }}>
              Past invoices
            </h2>
            <div className="ledger">
              {billing.pastInvoices.map((invoice) => (
                <LedgerRow
                  key={invoice.id}
                  title={invoice.label}
                  description={invoice.date}
                  meta={invoice.id}
                  value={formatMoney(invoice.amount)}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <p className="margin-box-title">Payment</p>
            <p className="ui-text">{billing.card.detail}</p>
            <div>
              <Button variant="quiet" size="sm">
                Update card
              </Button>
            </div>
          </div>
          <div className="margin-box">
            <p className="margin-box-title">Plan</p>
            <p className="ui-text">
              {billing.plan.name} · {billing.plan.seats} seats
            </p>
            <p className="caption">Cycle {billing.plan.cycle}</p>
            <div>
              <ButtonLink href="/upgrade" variant="quiet" size="sm">
                Change plan
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

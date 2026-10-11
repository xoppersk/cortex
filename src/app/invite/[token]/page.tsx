import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { LedgerRow } from "../../../components/LedgerRow";
import { getStates } from "../../../lib/api";

export const metadata: Metadata = { title: "You're invited" };

/* S-03 Invite: centred card, all details from the states fixture. */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // The token only gates the page's presence in this fixture-driven phase.
  await params;
  const { invite } = getStates();

  return (
    <main className="center-shell">
      <div className="center-card">
        <Link href="/" className="wordmark">
          Cortex
        </Link>
        <p className="caption">Invitation · expires {invite.expires}</p>
        <div className="stack-3">
          <h1 className="page-title" style={{ fontSize: 26 }}>
            {invite.inviter} invited you to {invite.workspace}.
          </h1>
          <p className="serif-lead" style={{ fontSize: 18 }}>
            You&rsquo;ll join as an {invite.role}: {invite.roleDescription}.
          </p>
        </div>

        <form className="stack-4" action="/app/new" method="get">
          <Field label="Joining as" htmlFor="invite-email">
            <input
              id="invite-email"
              name="email"
              type="email"
              className="field-control"
              defaultValue={invite.email}
              readOnly
            />
          </Field>
          <Field label="Your name, as teammates will see it" htmlFor="invite-name">
            <input
              id="invite-name"
              name="name"
              type="text"
              autoComplete="name"
              className="field-control"
              defaultValue={invite.name}
            />
          </Field>
          <div className="row">
            <Button type="submit" variant="primary" size="lg">
              Join {invite.workspace}
            </Button>
            <ButtonLink href="/" variant="quiet" size="lg">
              Decline
            </ButtonLink>
          </div>
        </form>

        <p className="caption">
          Not you? <Link href="/login">Sign in with another account</Link>. Joining adds a seat to
          the workspace&rsquo;s bill, not yours.
        </p>

        <div className="stack-3 hairline-top" style={{ paddingTop: 20 }}>
          <h2 className="section-label">Waiting for you</h2>
          <div className="ledger">
            {invite.waiting.map((item) => (
              <LedgerRow key={item.label} title={item.label} description={item.detail} />
            ))}
          </div>
          <blockquote className="pull-quote" style={{ fontSize: 18 }}>
            {invite.quote.text}
          </blockquote>
          <p className="caption">— {invite.quote.author}</p>
        </div>
        <p className="caption">© 2026 [Company] · Privacy · Terms · Security · Status · Help</p>
      </div>
    </main>
  );
}

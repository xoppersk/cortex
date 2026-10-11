import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { getStates } from "../../../lib/api";

export const metadata: Metadata = { title: "You’re invited" };

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
        <div className="stack-3">
          <h1 className="page-title" style={{ fontSize: 26 }}>
            {invite.inviter} invited you to {invite.workspace}
          </h1>
          <p className="serif-lead" style={{ fontSize: 18 }}>
            You’ll join as an {invite.role}.
          </p>
        </div>

        <form className="stack-4" action="/app/new" method="get">
          <Field label="Email" htmlFor="invite-email">
            <input
              id="invite-email"
              name="email"
              type="email"
              className="field-control"
              defaultValue={invite.email}
              readOnly
            />
          </Field>
          <Field label="Your name" htmlFor="invite-name">
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

        <div className="stack-3 hairline-top" style={{ paddingTop: 20 }}>
          <h2 className="section-label">What’s waiting</h2>
          <ul className="stack-2" style={{ listStyle: "none" }}>
            {invite.waiting.map((item) => (
              <li key={item} className="ui-text">
                {item}
              </li>
            ))}
          </ul>
          <p className="caption">This invite expires {invite.expires}.</p>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";

/*
 * Invite form (client part): the stacked, full-width Join (primary) /
 * Decline (quiet) pair. Join submits to /app/new
 * carrying name/email, as before. Decline is an action, not navigation:
 * it replaces the actions with a declined status line.
 */
export function InviteForm({
  email,
  name,
  workspace,
}: {
  email: string;
  name: string;
  workspace: string;
}) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <p role="status" className="pm-small" style={{ fontSize: 14 }}>
        You declined this invitation. If that was a mistake, open the invite link again.
      </p>
    );
  }

  return (
    <form action="/app/new" method="get" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pm-field">
        <label htmlFor="invite-email">Joining as</label>
        <input id="invite-email" name="email" type="email" className="pv-inp pm-inp-lg pv-inp-ro" defaultValue={email} readOnly />
      </div>
      <div className="pm-field">
        <label htmlFor="invite-name">Your name, as teammates will see it</label>
        <input id="invite-name" name="name" type="text" autoComplete="name" className="pv-inp pm-inp-lg" defaultValue={name} />
      </div>
      <Button type="submit" variant="primary" className="pm-btn-xl pm-btn-full" style={{ marginTop: 4 }}>
        Join {workspace}
        <Icon name="arrowRight" size={15} style={{ color: "currentColor" }} />
      </Button>
      <Button type="button" variant="quiet" className="pm-btn-xl pm-btn-full" onClick={() => setDeclined(true)}>
        Decline
      </Button>
      <p className="pm-small" style={{ fontSize: 12 }}>
        Not you? <Link href="/login" style={{ fontWeight: 400 }}>Sign in with another account</Link>. Joining adds a seat to the
        workspace&rsquo;s bill, not yours.
      </p>
    </form>
  );
}

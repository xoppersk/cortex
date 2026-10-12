"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";

/*
 * S-03 Invite form (client part): the designed stacked, full-width
 * Join (primary) / Decline (secondary) pair. Join submits to /app/new
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
      <p className="ui-text" role="status" style={{ fontSize: 14 }}>
        You declined this invitation. If that was a mistake, open the invite link again.
      </p>
    );
  }

  return (
    <form
      action="/app/new"
      method="get"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Field label="Joining as" htmlFor="invite-email">
        <input
          id="invite-email"
          name="email"
          type="email"
          className="field-control field-control-44"
          style={{ background: "var(--tint)" }}
          defaultValue={email}
          readOnly
        />
      </Field>
      <Field label="Your name, as teammates will see it" htmlFor="invite-name">
        <input
          id="invite-name"
          name="name"
          type="text"
          autoComplete="name"
          className="field-control field-control-44"
          defaultValue={name}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="btn-block">
        Join {workspace}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="btn-block"
        onClick={() => setDeclined(true)}
      >
        Decline
      </Button>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)" }}>
        Not you? <Link href="/login">Sign in with another account</Link>. Joining adds a seat to the
        workspace&rsquo;s bill, not yours.
      </p>
    </form>
  );
}

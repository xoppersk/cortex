"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { IconArrowRight } from "../../../components/icons";

/*
 * S-03 Invite form (client part), per screens/Invite.html (v2): in the
 * design the whole left card is one <form class="sheet lift">, so this
 * component renders that form and receives the card's static head
 * (inviter row, heading, role sentence) as children from the page.
 * Join submits to /app/new carrying name/email, as before. Decline is
 * the design's ghost button — an action, not navigation: it swaps the
 * form for the same card holding a declined status line.
 */
export function InviteForm({
  email,
  name,
  workspace,
  children,
}: {
  email: string;
  name: string;
  workspace: string;
  children?: ReactNode;
}) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="sheet lift sys-invite-card">
        {children}
        <p className="ui-text" role="status" style={{ fontSize: 14 }}>
          You declined this invitation. If that was a mistake, open the invite link again.
        </p>
      </div>
    );
  }

  return (
    <form action="/app/new" method="get" className="sheet lift sys-invite-card">
      {children}
      <Field label="Joining as" htmlFor="invite-email">
        <input
          id="invite-email"
          name="email"
          type="text"
          className="inp lg sys-inp-readonly"
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
          className="inp lg"
          defaultValue={name}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="sys-btn-block sys-invite-submit">
        Join {workspace}{" "}
        <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
      </Button>
      <Button
        type="button"
        variant="quiet"
        size="lg"
        className="sys-btn-block"
        onClick={() => setDeclined(true)}
      >
        Decline
      </Button>
      <p className="sys-legal-note">
        Not you? <Link href="/login">Sign in with another account</Link>. Joining adds a seat to the
        workspace&rsquo;s bill, not yours.
      </p>
    </form>
  );
}

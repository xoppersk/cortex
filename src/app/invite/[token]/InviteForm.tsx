"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";

import { Button, ButtonLink } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { IconArrowRight } from "../../../components/icons";
import { acceptInviteAction, type AuthFormState } from "../../../lib/auth/actions";

const initialState: AuthFormState = {};

/*
 * S-03 Invite form (client part), per screens/Invite.html (v2): the whole
 * left card is one .sheet.lift; the page passes the card's head (inviter
 * row, heading, role sentence) as children.
 *
 * Production modes:
 *  - "accept": a signed-in user whose email matches the invite. Join runs
 *    `acceptInviteAction` (inserts team_members, marks the invite
 *    accepted). Decline swaps the card to the design's declined state.
 *  - "signin": signed-out visitor — Join first routes through /login with
 *    next=/invite/<token>, returning here to accept.
 */
export function InviteForm({
  token,
  email,
  name,
  workspace,
  mode,
  children,
}: {
  token: string;
  email: string;
  name: string;
  workspace: string;
  mode: "accept" | "signin";
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, initialState);
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

  if (mode === "signin") {
    return (
      <div className="sheet lift sys-invite-card">
        {children}
        <Field label="Joining as" htmlFor="invite-email">
          <input
            id="invite-email"
            type="text"
            className="inp lg sys-inp-readonly"
            defaultValue={email}
            readOnly
          />
        </Field>
        <ButtonLink
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          variant="primary"
          size="lg"
          className="sys-btn-block sys-invite-submit"
        >
          Sign in to join {workspace}{" "}
          <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
        </ButtonLink>
        <p className="sys-legal-note">
          No account yet? <Link href="/signup">Create one</Link> with this email address and the
          invitation will be waiting. Joining adds a seat to the workspace&rsquo;s bill, not
          yours.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="sheet lift sys-invite-card">
      {children}
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="sys-set-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <Field label="Joining as" htmlFor="invite-email">
        <input
          id="invite-email"
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
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="sys-btn-block sys-invite-submit"
        disabled={pending}
      >
        {pending ? "Joining…" : `Join ${workspace}`}{" "}
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
        Not you? <Link href="/login">Sign in with another account</Link>. Joining adds a seat to
        the workspace&rsquo;s bill, not yours.
      </p>
    </form>
  );
}

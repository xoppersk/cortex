import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "../../../components/Button";
import { LegalFooter } from "../../../components/SiteHeader";
import { signOutAction } from "../../../lib/auth/actions";
import { getUser } from "../../../lib/auth/get-user";
import { classifyInvite, getInviteByToken, type InviteRecord } from "../../../lib/auth/invites";
import { InviteForm } from "./InviteForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const invite = await getInviteByToken(token).catch(() => null);
  return {
    title: { absolute: invite ? `Cortex — Join ${invite.teamName}` : "Cortex — Invitation" },
  };
}

const ROLE_COPY: Record<InviteRecord["role"], { word: string; description: string }> = {
  member: {
    word: "Member",
    description: "you can ask questions, run playbooks and upload documents",
  },
  admin: {
    word: "Admin",
    description: "you can manage members and workspace settings, and everything members can do",
  },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function StateCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="sheet lift sys-invite-card">
      <h1 className="sys-invite-title">{title}</h1>
      <div className="ui-text" style={{ fontSize: 14, lineHeight: 1.55 }}>
        {body}
      </div>
    </div>
  );
}

/*
 * S-03 Invite, per screens/Invite.html (v2): header (brand only) → centred
 * row: the .sheet.lift invite card beside a "Waiting for you" .sheet aside
 * → LegalFooter. Now driven by the real `team_invites` row (SHA-256 token
 * hash lookup, service-role — see lib/auth/invites.ts).
 *
 * Real states implemented (the fixture had only the happy path):
 * valid · expired · already accepted · not found · signed-out (sign in to
 * join) · wrong account (invited email ≠ signed-in email). The fixture's
 * "Waiting for you" rows and inviter quote were content belonging to one
 * fictional workspace, so the aside now shows the real invite facts
 * (workspace, role, expiry) in the same rows.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = classifyInvite(await getInviteByToken(token));
  const user = await getUser();

  let card: React.ReactNode;
  let aside: React.ReactNode = null;

  if (state.kind === "not-found") {
    card = (
      <StateCard
        title="This invitation isn't valid"
        body={
          <p>
            The link may have been copied incompletely, or the invitation was withdrawn. Ask the
            workspace admin to send a fresh invitation.{" "}
            <Link href="/login">Sign in</Link>
          </p>
        }
      />
    );
  } else if (state.kind === "expired") {
    card = (
      <StateCard
        title="This invitation has expired"
        body={
          <p>
            The invitation to <b>{state.invite.teamName}</b> expired on{" "}
            {formatDate(state.invite.expiresAt)}. Ask the workspace admin to send a new one.
          </p>
        }
      />
    );
  } else if (state.kind === "accepted") {
    card = (
      <StateCard
        title="You've already joined"
        body={
          <>
            <p>
              This invitation to <b>{state.invite.teamName}</b> was accepted on{" "}
              {formatDate(state.invite.acceptedAt!)}.
            </p>
            <p style={{ marginTop: 12 }}>
              {user ? (
                <Link href="/app">Open your workspace</Link>
              ) : (
                <Link href={`/login?next=${encodeURIComponent("/app")}`}>Sign in to open it</Link>
              )}
            </p>
          </>
        }
      />
    );
  } else {
    const invite = state.invite;
    const role = ROLE_COPY[invite.role];
    const inviterName = invite.invitedByName ?? "A teammate";
    const initials = inviterName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const emailMatches =
      user?.email && user.email.toLowerCase() === invite.email.toLowerCase();

    const head = (
      <>
        <span className="sys-invite-top">
          <span style={{ display: "flex" }}>
            <span className="av av-ink sys-invite-av">{initials}</span>
          </span>
          <span className="tag ln">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ width: 13, height: 13 }}
            >
              <circle cx="8" cy="8" r="5.5" />
              <path d="M8 5v3l2 1.5" />
            </svg>
            Invitation · expires {formatDate(invite.expiresAt)}
          </span>
        </span>
        <h1 className="sys-invite-title">
          {inviterName} invited you to {invite.teamName}.
        </h1>
        <p className="sys-invite-role">
          You&rsquo;ll join as an <b className="sys-role-mark">{role.word}</b>: {role.description}
          .
        </p>
      </>
    );

    if (!user) {
      card = (
        <InviteForm
          token={token}
          email={invite.email}
          name=""
          workspace={invite.teamName}
          mode="signin"
        >
          {head}
        </InviteForm>
      );
    } else if (!emailMatches) {
      card = (
        <div className="sheet lift sys-invite-card">
          {head}
          <p className="ui-text" role="alert" style={{ fontSize: 14, lineHeight: 1.55 }}>
            This invitation was sent to <b>{invite.email}</b>, but you&rsquo;re signed in as{" "}
            <b>{user.email}</b>. Sign out and sign back in with the invited account to accept it.
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="primary" size="lg" className="sys-btn-block">
              Sign out and switch account
            </Button>
          </form>
          <p className="sys-legal-note">
            Or <Link href="/app">go back to your own workspace</Link>.
          </p>
        </div>
      );
    } else {
      card = (
        <InviteForm
          token={token}
          email={invite.email}
          name={
            typeof user.user_metadata?.display_name === "string"
              ? user.user_metadata.display_name
              : ""
          }
          workspace={invite.teamName}
          mode="accept"
        >
          {head}
        </InviteForm>
      );
    }

    aside = (
      <aside className="sheet sys-waiting-aside">
        <h2 className="lbl sys-waiting-title">Waiting for you</h2>
        <div>
          <div className="sys-ir">
            <span className="sys-ir-label">{invite.teamName}</span>
            <span className="sys-ir-detail">workspace</span>
          </div>
          <div className="sys-ir">
            <span className="sys-ir-label">{role.word} seat</span>
            <span className="sys-ir-detail">your role</span>
          </div>
          <div className="sys-ir">
            <span className="sys-ir-label">{formatDate(invite.expiresAt)}</span>
            <span className="sys-ir-detail">invitation expires</span>
          </div>
        </div>
        <p className="sys-invite-quote">
          Invited by {inviterName} · sent to {invite.email}
        </p>
      </aside>
    );
  }

  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
      </header>

      <div className="sys-main">
        {card}
        {aside}
      </div>

      <LegalFooter />
    </div>
  );
}

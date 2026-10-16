import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "../../../components/SiteHeader";
import { IconBook, IconChat, IconDatabase } from "../../../components/icons";
import { getStates } from "../../../lib/api";
import { InviteForm } from "./InviteForm";

export async function generateMetadata(): Promise<Metadata> {
  const { invite } = getStates();
  return { title: { absolute: `Cortex — Join ${invite.workspace}` } };
}

/* Waiting-row icons from screens/Invite.html, in the fixture's row order:
   conversation (chat), two playbooks (book), knowledge bases (database). */
const waitingIcons = [IconChat, IconBook, IconBook, IconDatabase];

/*
 * S-03 Invite, per screens/Invite.html (v2): header (brand only) → centred
 * row: the .sheet.lift form card (flex 1 1 400px, max 480px; inviter
 * avatar + expiry tag, heading, role sentence with the role word on
 * --highlight, prefilled email, name, Join / Decline) beside the
 * "Waiting for you" .sheet aside (flex 1 1 320px, max 400px, margin-top
 * 24px) with icon rows and the inviter's quote on --paper-sunk →
 * LegalFooter.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // The token only gates the page's presence in this fixture-driven phase.
  await params;
  const { invite } = getStates();
  const initials = invite.inviter
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div className="sys-page">
      <header className="sys-topbar">
        <Link href="/" className="brand" aria-label="Cortex home">
          <i aria-hidden="true">C</i>
          <b>Cortex</b>
        </Link>
      </header>

      <div className="sys-main">
        <InviteForm email={invite.email} name={invite.name} workspace={invite.workspace}>
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
              Invitation · expires {invite.expires}
            </span>
          </span>
          <h1 className="sys-invite-title">
            {invite.inviter} invited you to {invite.workspace}.
          </h1>
          <p className="sys-invite-role">
            You&rsquo;ll join as an <b className="sys-role-mark">{invite.role}</b>:{" "}
            {invite.roleDescription}.
          </p>
        </InviteForm>

        <aside className="sheet sys-waiting-aside">
          <h2 className="lbl sys-waiting-title">Waiting for you</h2>
          <div>
            {invite.waiting.map((item, index) => {
              const Icon = waitingIcons[index] ?? IconBook;
              return (
                <div key={item.label} className="sys-ir">
                  <span className="ib">
                    <Icon style={{ width: 15, height: 15 }} />
                  </span>
                  <span className="sys-ir-label">{item.label}</span>
                  <span className="sys-ir-detail">{item.detail}</span>
                </div>
              );
            })}
          </div>
          <p className="sys-invite-quote">
            {invite.quote.text}{" "}
            <span className="sys-invite-quote-author">— {invite.quote.author}</span>
          </p>
        </aside>
      </div>

      <LegalFooter />
    </div>
  );
}

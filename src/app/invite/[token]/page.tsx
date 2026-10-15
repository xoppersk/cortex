import type { Metadata } from "next";
import { Icon, type IconName } from "../../../components/Icon";
import { LegalFooter, SiteBrand } from "../../../components/SiteHeader";
import { getStates } from "../../../lib/api";
import { InviteForm } from "./InviteForm";

export async function generateMetadata(): Promise<Metadata> {
  const { invite } = getStates();
  return { title: { absolute: `Cortex — Join ${invite.workspace}` } };
}

/*
 * Invite (Premium v2): ground page, a lifted invitation card beside a
 * "Waiting for you" sheet, then the legal line.
 */
function waitingIcon(detail: string): IconName {
  if (detail.includes("conversation")) return "chat";
  if (detail.includes("playbook")) return "book";
  return "database";
}

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
    <div className="pm-page">
      <header className="pm-sys-head">
        <SiteBrand />
      </header>

      <main className="pm-sys-body">
        <div className="pm-sheet pm-lift pm-invite">
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pv-av pv-av-ink pv-av-lg" aria-hidden="true">
              {initials}
            </span>
            <span className="pv-tag pv-tag-ln">
              <Icon name="clock" size={12} />
              Invitation · expires {invite.expires}
            </span>
          </span>
          <h1>
            {invite.inviter} invited you to {invite.workspace}.
          </h1>
          <p className="pm-invite-role">
            You&rsquo;ll join as an <b>{invite.role}</b>: {invite.roleDescription}.
          </p>
          <InviteForm email={invite.email} name={invite.name} workspace={invite.workspace} />
        </div>

        <aside className="pm-sheet pm-waiting" aria-labelledby="waiting-heading">
          <h2 className="pv-lbl" id="waiting-heading">
            Waiting for you
          </h2>
          <ul>
            {invite.waiting.map((item) => (
              <li key={item.label} className="pm-ir">
                <span className="pm-ib" aria-hidden="true">
                  <Icon name={waitingIcon(item.detail)} />
                </span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                <span className="pm-ir-detail">{item.detail}</span>
              </li>
            ))}
          </ul>
          <p className="pm-waiting-quote">
            {invite.quote.text} <span>— {invite.quote.author}</span>
          </p>
        </aside>
      </main>

      <LegalFooter />
    </div>
  );
}

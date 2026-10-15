"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { Icon, type IconName } from "../../../components/Icon";
import { SettingsHeader } from "../../../components/Shells";
import { getMembers } from "../../../lib/api";
import type { Member, Role } from "../../../lib/types";
import { cx } from "../../../lib/utils";
import { InviteForm } from "./InviteForm";

const ROLE_CYCLE: Role[] = ["Editor", "Viewer", "Admin"];
const ROLE_ICONS: Record<Role, IconName> = { Viewer: "eye", Editor: "pencil", Admin: "shield" };

function roleOptions(current: Role): Role[] {
  const start = ROLE_CYCLE.indexOf(current);
  return [0, 1, 2].map((i) => ROLE_CYCLE[(start + i) % 3]!);
}

function memberTone(name: string) {
  if (name === "Sheku Koroma") return "pv-av-ink";
  if (name.startsWith("Maya")) return "pv-av-1";
  if (name.startsWith("Priya")) return "pv-av-sel";
  if (name.startsWith("Owen")) return "pv-av-2";
  return "pv-av-3";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  label: string;
  status: string;
}

export default function MembersPage() {
  const data = getMembers();
  const [members, setMembers] = useState<Member[]>(data.members);
  const [invites, setInvites] = useState<PendingInvite[]>([
    {
      id: "initial-invite",
      email: data.pendingInvite.email,
      role: data.pendingInvite.role,
      label: data.pendingInvite.label,
      status: data.pendingInvite.status,
    },
  ]);
  const [resentId, setResentId] = useState<string | null>(null);

  function addInvite({ email, role }: { email: string; role: Role }) {
    setInvites((previous) => [
      ...previous,
      {
        id: `invite-${email}-${previous.length}`,
        email,
        role,
        label: "Invited by you, Oct 6 · expires Oct 13",
        status: "Not joined",
      },
    ]);
  }

  function removeMember(id: string) {
    setMembers((previous) => previous.filter((member) => member.id !== id));
  }

  function changeRole(id: string, role: Role) {
    setMembers((previous) => previous.map((member) => (member.id === id ? { ...member, role } : member)));
  }

  function cancelInvite(id: string) {
    setInvites((previous) => previous.filter((invite) => invite.id !== id));
  }

  function resendInvite(id: string) {
    setResentId(id);
    window.setTimeout(() => setResentId((current) => (current === id ? null : current)), 2000);
  }

  const footerParts = data.rolesFooter.split("audit log");

  return (
    <>
      <SettingsHeader
        title="Members"
        lede={data.summary}
        actions={
          <span className="pv-avs pv-avs-tight5" aria-hidden="true">
            {members.map((member) => (
              <span key={member.id} className={`pv-av ${memberTone(member.name)}`}>
                {initials(member.name)}
              </span>
            ))}
          </span>
        }
      />

      <div className="pv-split">
        <div className="pv-set-main">
          <InviteForm onInvite={addInvite} />

          <div className="pv-card" style={{ overflow: "hidden" }}>
            <div role="table" aria-label="Everyone in this workspace" className="pv-rows">
              <div role="row" className="pv-row pv-row-head pv-memr pv-th pv-stack">
                <span role="columnheader">Person</span>
                <span role="columnheader">Role</span>
                <span role="columnheader">Last active</span>
                <span role="columnheader">
                  <span className="sr-only">Actions</span>
                </span>
              </div>
              {members.map((member) => (
                <div role="row" key={member.id} className={cx("pv-row pv-memr pv-stack", member.note && "pv-row-soft")}>
                  <span role="cell" className="pv-who">
                    <span className={`pv-av pv-av-lg ${memberTone(member.name)}`} aria-hidden="true">
                      {initials(member.name)}
                    </span>
                    <span className="pv-who-text">
                      <b>
                        {member.name}
                        {member.self ? <span className="pv-you"> (you)</span> : null}
                      </b>
                      <span>{member.detail}</span>
                    </span>
                  </span>
                  <span role="cell">
                    {member.self ? (
                      <span className="pv-tag pv-tag-dk">{member.role}</span>
                    ) : (
                      <select
                        className={cx("pv-sel pv-sel-sm", member.note && "pv-sel-changed")}
                        style={{ width: 110 }}
                        value={member.role}
                        onChange={(event) => changeRole(member.id, event.target.value as Role)}
                        aria-label={`Role for ${member.name}`}
                      >
                        {roleOptions(member.role).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                  </span>
                  <span role="cell" className={member.self ? "pv-ok-row" : undefined} style={member.self ? undefined : { color: "var(--ink-2)" }}>
                    <span className="pv-row-cell-label">Last active</span>
                    {member.self ? <span className="pv-dot" aria-hidden="true" /> : null}
                    {member.lastActive}
                  </span>
                  <span role="cell" className="pv-row-actions">
                    {member.note ? (
                      <span className="pv-tag pv-tag-hl">{member.note}</span>
                    ) : member.removable ? (
                      <Button variant="quiet" size="sm" onClick={() => removeMember(member.id)} aria-label={`Remove ${member.name}`}>
                        Remove
                      </Button>
                    ) : null}
                  </span>
                </div>
              ))}
              {invites.map((invite) => (
                <div role="row" key={invite.id} className="pv-row pv-memr pv-stack pv-row-soft">
                  <span role="cell" className="pv-who">
                    <span className="pv-av pv-av-lg pv-av-ln" aria-hidden="true">
                      <Icon name="mail" />
                    </span>
                    <span className="pv-who-text">
                      <b className="pv-who-email">{invite.email}</b>
                      <span>{invite.label}</span>
                    </span>
                  </span>
                  <span role="cell">
                    <span className="pv-tag pv-tag-ln">{invite.role}</span>
                  </span>
                  <span role="cell" className="pv-ok-row" style={{ color: "var(--ink-3)" }}>
                    <span className="pv-dot pv-dot-empty" aria-hidden="true" />
                    {invite.status}
                  </span>
                  <span role="cell" className="pv-row-actions">
                    <Button variant="secondary" size="sm" onClick={() => resendInvite(invite.id)} aria-label={`Resend invite to ${invite.email}`}>
                      {resentId === invite.id ? "Resent" : "Resend"}
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => cancelInvite(invite.id)} aria-label={`Cancel invite to ${invite.email}`}>
                      Cancel
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="pv-side" aria-labelledby="roles-heading">
          <h2 className="pv-lbl pv-side-lbl" id="roles-heading">
            What each role can do
          </h2>
          {data.roleDefinitions.map((definition) => (
            <section key={definition.role} className="pv-card pv-role">
              <b>
                <Icon name={ROLE_ICONS[definition.role]} style={{ color: "var(--ink-3)" }} />
                {definition.role}
              </b>
              <span>{definition.description}</span>
            </section>
          ))}
          <p className="pv-side-foot">
            {footerParts[0]}
            <Link href="/settings/audit">audit log</Link>
            {footerParts.slice(1).join("audit log")}
          </p>
        </aside>
      </div>
    </>
  );
}

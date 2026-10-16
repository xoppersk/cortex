"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { getMembers, getWorkspaceData } from "../../../lib/api";
import type { Member, Role } from "../../../lib/types";
import { InviteForm } from "./InviteForm";

/* Avatar tints, copied from the screen, keyed by member id. */
const AVATAR_BG: Record<string, CSSProperties> = {
  "sheku-koroma": { background: "var(--ink)", color: "var(--on-ink)" },
  "maya-jordan": { background: "#E9E3C7" },
  "priya-shah": { background: "#E6E6E2" },
  "owen-clarke": { background: "#DDE3E9" },
  "lena-brooks": { background: "#E3E7DF" },
};

const ROLE_ORDER: Role[] = ["Editor", "Viewer", "Admin"];

/* Current role first, then the remaining roles in the screen's order. */
function roleOptions(current: Role): Role[] {
  return [current, ...ROLE_ORDER.filter((role) => role !== current)];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
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
  const { workspace } = getWorkspaceData();
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
      <header className="ph ad-ph">
        <div className="ad-ph-left">
          <span className="sub">
            {workspace.name} <span className="sep">/</span> Settings
          </span>
          <h1>Members</h1>
          <p className="ad-lede">{data.summary}</p>
        </div>
        <span className="ad-ph-avatars" aria-hidden="true">
          {data.members.map((member) => (
            <span key={member.id} className="av" style={AVATAR_BG[member.id]}>
              {initials(member.name)}
            </span>
          ))}
        </span>
      </header>

      <div className="ad-cols">
        <div className="ad-main">
          <InviteForm onInvite={addInvite} />

          <div className="card" style={{ overflow: "hidden" }}>
            <div className="table-scroll">
              <div role="table" aria-label="Members">
                <div role="row" className="ad-mr ad-mr-head th">
                  <span role="columnheader">Person</span>
                  <span role="columnheader">Role</span>
                  <span role="columnheader">Last active</span>
                  <span role="columnheader">
                    <span className="sr-only">Actions</span>
                  </span>
                </div>
                {members.map((member) => (
                  <div
                    key={member.id}
                    role="row"
                    className="ad-mr"
                    style={member.note ? { background: "#FCFCFB" } : undefined}
                  >
                    <span role="cell" className="ad-who">
                      <span className="av" style={AVATAR_BG[member.id]} aria-hidden="true">
                        {initials(member.name)}
                      </span>
                      <span className="ad-who-stack">
                        <span className="ad-who-name">
                          {member.name}
                          {member.self ? (
                            <span style={{ fontWeight: 400, fontSize: 13, color: "var(--ink-4)" }}> (you)</span>
                          ) : null}
                        </span>
                        <span className="ad-who-detail">{member.detail}</span>
                      </span>
                    </span>
                    <span role="cell">
                      {member.self ? (
                        <span className="tag dk">{member.role}</span>
                      ) : (
                        <>
                          <label className="sr-only" htmlFor={`role-${member.id}`}>
                            Role for {member.name}
                          </label>
                          <select
                            id={`role-${member.id}`}
                            className="sel ad-sel ad-sel-sm"
                            style={member.note ? { width: 110, borderColor: "var(--ink)" } : { width: 110 }}
                            value={member.role}
                            onChange={(event) => changeRole(member.id, event.target.value as Role)}
                          >
                            {roleOptions(member.role).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </span>
                    <span role="cell">
                      {member.self ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)" }}>
                          <span className="ad-dot" aria-hidden="true" />
                          {member.lastActive}
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-2)" }}>{member.lastActive}</span>
                      )}
                    </span>
                    <span role="cell" style={{ textAlign: "right" }}>
                      {member.note ? (
                        <span className="tag tag-highlight">{member.note}</span>
                      ) : member.removable ? (
                        <button type="button" className="btn gh sm" onClick={() => removeMember(member.id)}>
                          Remove
                        </button>
                      ) : null}
                    </span>
                  </div>
                ))}
                {invites.map((invite) => (
                  <div key={invite.id} role="row" className="ad-mr" style={{ background: "#FCFCFB" }}>
                    <span role="cell" className="ad-who">
                      <span
                        className="av"
                        style={{ background: "var(--paper)", boxShadow: "inset 0 0 0 1px #B9B9B3" }}
                        aria-hidden="true"
                      >
                        <svg
                          className="ic"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path d="M2.5 4.5h11v7h-11z" />
                          <path d="m2.5 4.5 5.5 4 5.5-4" />
                        </svg>
                      </span>
                      <span className="ad-who-stack">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13.5,
                            lineHeight: 1.3,
                            fontWeight: 500,
                            color: "var(--ink-2)",
                          }}
                        >
                          {invite.email}
                        </span>
                        <span className="ad-who-detail">{invite.label}</span>
                      </span>
                    </span>
                    <span role="cell">
                      <span className="tag ln">{invite.role}</span>
                    </span>
                    <span role="cell">
                      <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink-3)" }}>
                        <span className="ad-dot ad-dot-open" aria-hidden="true" />
                        {invite.status}
                      </span>
                    </span>
                    <span role="cell" style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 4 }}>
                      <button type="button" className="btn sm" onClick={() => resendInvite(invite.id)}>
                        {resentId === invite.id ? "Resent" : "Resend"}
                      </button>
                      <button type="button" className="btn gh sm" onClick={() => cancelInvite(invite.id)}>
                        Cancel
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="ad-side" aria-label="Roles">
          <h2 className="lbl" style={{ marginBottom: 2 }}>What each role can do</h2>
          {data.roleDefinitions.map((definition) => (
            <section key={definition.role} className="card ad-side-card ad-role-card">
              <b>
                {definition.role === "Viewer" ? (
                  <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
                    <circle cx="8" cy="8" r="2" />
                  </svg>
                ) : definition.role === "Editor" ? (
                  <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M10.5 2.5 13.5 5.5 6 13H3v-3z" />
                  </svg>
                ) : (
                  <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M8 1.5 13 3.5v4c0 3-2.2 5.3-5 6.5-2.8-1.2-5-3.5-5-6.5v-4z" />
                  </svg>
                )}
                {definition.role}
              </b>
              <span>{definition.description}</span>
            </section>
          ))}
          <p className="ad-side-foot">
            {footerParts[0]}
            <Link href="/settings/audit">audit log</Link>
            {footerParts.slice(1).join("audit log")}
          </p>
        </aside>
      </div>
    </>
  );
}

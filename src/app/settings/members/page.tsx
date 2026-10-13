"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/Button";
import { getMembers } from "../../../lib/api";
import type { Member, Role } from "../../../lib/types";
import { InviteForm } from "./InviteForm";

const ROLE_CYCLE: Role[] = ["Editor", "Viewer", "Admin"];

function roleOptions(current: Role): Role[] {
  const start = ROLE_CYCLE.indexOf(current);
  return [0, 1, 2].map((i) => ROLE_CYCLE[(start + i) % 3]!);
}

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  label: string;
  status: string;
}

const quietRowButton = { minHeight: 26, padding: "0 6px" } as const;

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
      <header className="page-head">
        <h1 className="page-title">Members</h1>
        <p className="summary-sentence">{data.summary}</p>
      </header>

      <div className="doc-margin">
        <div className="doc-column stack-6" style={{ maxWidth: 680 }}>
          <InviteForm onInvite={addInvite} />

          <section aria-label="Everyone in this workspace">
            <div className="table-scroll">
              <table className="data-table members-table">
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col">Role</th>
                    <th scope="col">Last active</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} style={member.note ? { background: "#FAFAF8" } : undefined}>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                          {member.name}
                          {member.self ? (
                            <span style={{ fontWeight: 400, color: "var(--ink-4)" }}> (you)</span>
                          ) : null}
                        </span>
                        <br />
                        <span className="caption">{member.detail}</span>
                      </td>
                      <td>
                        {member.self ? (
                          <span>{member.role}</span>
                        ) : (
                          <select
                            className="field-control"
                            value={member.role}
                            onChange={(event) => changeRole(member.id, event.target.value as Role)}
                            aria-label={`Role for ${member.name}`}
                            style={{ minHeight: 30, height: 30, padding: "0 8px", width: "auto", minWidth: 110 }}
                          >
                            {roleOptions(member.role).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{member.lastActive}</td>
                      <td style={{ textAlign: "right" }}>
                        {member.note ? (
                          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{member.note}</span>
                        ) : member.removable ? (
                          <Button variant="quiet" size="sm" style={quietRowButton} onClick={() => removeMember(member.id)}>
                            Remove
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {invites.map((invite) => (
                    <tr key={invite.id}>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>{invite.email}</span>
                        <br />
                        <span className="caption">{invite.label}</span>
                      </td>
                      <td>{invite.role}</td>
                      <td>{invite.status}</td>
                      <td>
                        <span className="row" style={{ flexWrap: "nowrap", gap: "var(--space-1)" }}>
                          <Button variant="quiet" size="sm" style={quietRowButton} onClick={() => resendInvite(invite.id)}>
                            {resentId === invite.id ? "Resent" : "Resend"}
                          </Button>
                          <Button variant="quiet" size="sm" style={quietRowButton} onClick={() => cancelInvite(invite.id)}>
                            Cancel
                          </Button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">What each role can do</h2>
            {data.roleDefinitions.map((definition) => (
              <div key={definition.role}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{definition.role}</p>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>{definition.description}</p>
              </div>
            ))}
            <div className="hairline-top" style={{ paddingTop: "var(--space-4)" }}>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
                {footerParts[0]}
                <Link href="/settings/audit">audit log</Link>
                {footerParts.slice(1).join("audit log")}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

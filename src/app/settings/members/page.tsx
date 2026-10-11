import { Button } from "../../../components/Button";
import { getMembers, getWorkspaceData } from "../../../lib/api";
import type { Role } from "../../../lib/types";
import { InviteForm } from "./InviteForm";

const ROLES: Role[] = ["Admin", "Editor", "Viewer"];

export default function MembersPage() {
  const { members, pendingInvite, roleDefinitions } = getMembers();
  const { workspace } = getWorkspaceData();

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Members</h1>
        <p className="summary-sentence">
          {members.length} people belong to {workspace.name}, and one invite is still pending.
        </p>
      </header>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <section className="stack-4" aria-labelledby="invite-heading">
            <h2 className="section-label" id="invite-heading">
              Invite someone
            </h2>
            <InviteForm />
          </section>

          <section aria-labelledby="members-heading">
            <h2 className="section-label" id="members-heading" style={{ marginBottom: 16 }}>
              Everyone in this workspace
            </h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Team</th>
                    <th scope="col">Last active</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <span className="ui-strong" style={{ fontSize: 13 }}>
                          {member.name}
                        </span>
                        <br />
                        <span className="caption">{member.email}</span>
                      </td>
                      <td>
                        <select
                          className="field-control"
                          defaultValue={member.role}
                          aria-label={`Role for ${member.name}`}
                          style={{ minWidth: 110 }}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {member.team}
                        {member.detail !== member.team ? (
                          <>
                            <br />
                            <span className="caption">{member.detail}</span>
                          </>
                        ) : null}
                      </td>
                      <td>{member.lastActive}</td>
                      <td />
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <span className="ui-strong" style={{ fontSize: 13 }}>
                        {pendingInvite.name}
                      </span>
                      <br />
                      <span className="caption">{pendingInvite.email}</span>
                      <br />
                      <span className="caption">Invite pending</span>
                    </td>
                    <td>{pendingInvite.role}</td>
                    <td>Expires {pendingInvite.expires}</td>
                    <td>Sent {pendingInvite.sent}</td>
                    <td>
                      <span className="row" style={{ flexWrap: "nowrap" }}>
                        <Button variant="quiet" size="sm">
                          Resend
                        </Button>
                        <Button variant="quiet" size="sm">
                          Cancel
                        </Button>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <p className="margin-box-title">Roles</p>
            {roleDefinitions.map((definition) => (
              <div key={definition.role} className="stack-2">
                <p className="ui-strong" style={{ fontSize: 13 }}>
                  {definition.role}
                </p>
                <p className="caption">{definition.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

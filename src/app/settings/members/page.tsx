import { Button } from "../../../components/Button";
import { getMembers } from "../../../lib/api";
import type { Role } from "../../../lib/types";
import { InviteForm } from "./InviteForm";

const ROLES: Role[] = ["Admin", "Editor", "Viewer"];

export default function MembersPage() {
  const { summary, members, pendingInvite, roleDefinitions, rolesFooter } = getMembers();

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">Members</h1>
        <p className="summary-sentence">{summary}</p>
      </header>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          <section className="stack-4" aria-labelledby="invite-heading">
            <h2 className="section-label" id="invite-heading">
              Invite by email
            </h2>
            <InviteForm />
          </section>

          <section aria-label="Everyone in this workspace">
            <div className="table-scroll">
              <table className="data-table">
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
                    <tr key={member.id}>
                      <td>
                        <span className="ui-strong" style={{ fontSize: 13 }}>
                          {member.name}
                          {member.self ? " (you)" : ""}
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
                        )}
                      </td>
                      <td>
                        {member.lastActive}
                        {member.note ? (
                          <>
                            <br />
                            <span className="caption">{member.note}</span>
                          </>
                        ) : null}
                      </td>
                      <td>
                        {member.removable ? (
                          <Button variant="quiet" size="sm">
                            Remove
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <span className="ui-strong" style={{ fontSize: 13 }}>
                        {pendingInvite.email}
                      </span>
                      <br />
                      <span className="caption">{pendingInvite.label}</span>
                    </td>
                    <td>{pendingInvite.role}</td>
                    <td>{pendingInvite.status}</td>
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
            <p className="margin-box-title">What each role can do</p>
            {roleDefinitions.map((definition) => (
              <div key={definition.role} className="stack-2">
                <p className="ui-strong" style={{ fontSize: 13 }}>
                  {definition.role}
                </p>
                <p className="caption">{definition.description}</p>
              </div>
            ))}
            <p className="caption">{rolesFooter}</p>
          </div>
        </aside>
      </div>
    </>
  );
}

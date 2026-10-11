import { Button } from "../../../components/Button";
import { getAdminData, getWorkspaceData } from "../../../lib/api";
import { formatMoney, sum } from "../../../lib/utils";
import { RevealPanel } from "./RevealPanel";

export default function ApiKeysPage() {
  const { apiKeys } = getAdminData();
  const { workspace } = getWorkspaceData();
  const keysTotal = sum(apiKeys.rows.map((row) => row.cost));

  return (
    <>
      <header className="page-head">
        <h1 className="page-title">API keys</h1>
        <p className="summary-sentence">
          Keys spent {formatMoney(keysTotal)} of the {formatMoney(workspace.spend)} this workspace used
          this cycle, and every key spends against the monthly limit.
        </p>
      </header>

      <div className="stack-6">
        <RevealPanel apiKey={apiKeys.reveal.key} label={apiKeys.reveal.label} warning={apiKeys.reveal.warning} />

        <section aria-labelledby="keys-heading">
          <h2 className="section-label" id="keys-heading" style={{ marginBottom: 16 }}>
            All keys
          </h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Access</th>
                  <th scope="col">Last used</th>
                  <th scope="col" className="numeric">
                    This cycle
                  </th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="ui-strong" style={{ fontSize: 13 }}>
                        {row.name}
                      </span>
                    </td>
                    <td>
                      {row.access}
                      {row.flag ? (
                        <>
                          <br />
                          <span className="warn-text">{row.flag}</span>
                        </>
                      ) : null}
                    </td>
                    <td>{row.lastUsed}</td>
                    <td className="numeric">{formatMoney(row.cost)}</td>
                    <td>
                      <Button variant="quiet" size="sm">
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

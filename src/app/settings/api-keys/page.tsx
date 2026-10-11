import { Button } from "../../../components/Button";
import { getAdminData } from "../../../lib/api";
import { RevealPanel } from "./RevealPanel";

export default function ApiKeysPage() {
  const { apiKeys } = getAdminData();

  return (
    <>
      <header className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">API keys</h1>
          <Button variant="primary" size="md">
            Create key
          </Button>
        </div>
        <p className="summary-sentence">{apiKeys.summary}</p>
      </header>

      <div className="stack-6">
        <RevealPanel reveal={apiKeys.reveal} />

        <section aria-label="All keys">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Access</th>
                  <th scope="col">Last used</th>
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
                      <br />
                      <span className="caption">
                        <span className="code">{row.masked}</span> · {row.createdNote}
                      </span>
                    </td>
                    <td>
                      {row.access}
                      {"flag" in row && row.flag ? (
                        <>
                          <br />
                          <span className="warn-text">{row.flag}</span>
                        </>
                      ) : null}
                      {"expiresNote" in row && row.expiresNote ? (
                        <>
                          <br />
                          <span className="caption">{row.expiresNote}</span>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {row.lastUsed}
                      {row.cost ? (
                        <>
                          <br />
                          <span className="caption">${row.cost} this cycle</span>
                        </>
                      ) : null}
                    </td>
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
          <p className="caption" style={{ marginTop: "var(--space-4)" }}>
            {apiKeys.footerNote}
          </p>
        </section>
      </div>
    </>
  );
}

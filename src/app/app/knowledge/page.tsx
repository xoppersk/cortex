import Link from "next/link";
import { Button } from "../../../components/Button";
import { getKnowledge } from "../../../lib/api";
import { formatNumber } from "../../../lib/utils";
import type { Collection } from "../../../lib/types";

function CollectionStatus({ collection }: { collection: Collection }) {
  const { status } = collection;
  if (status.type === "indexing") {
    const percent = status.percent ?? 0;
    return (
      <div className="stack-2">
        <span>{status.label}</span>
        <div className="progress-track" role="img" aria-label={`Indexing ${percent}% complete`}>
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        {status.note ? <span className="caption">{status.note}</span> : null}
      </div>
    );
  }
  return (
    <span>
      {status.label}
      {status.note ? (
        <>
          <br />
          <span className="caption">{status.note}</span>
        </>
      ) : null}
    </span>
  );
}

export default function KnowledgePage() {
  const knowledge = getKnowledge();
  const { collections } = knowledge;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Knowledge bases</h1>
        <p className="summary-sentence">{knowledge.summary}</p>
        <div className="row-between" style={{ marginTop: "var(--space-4)" }}>
          <Link href="/app/knowledge/documents">Upload documents</Link>
          <Button variant="primary" size="md">
            New knowledge base
          </Button>
        </div>
      </div>

      <div className="doc-margin">
        <div className="doc-column">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Collection</th>
                  <th scope="col" className="numeric">
                    Documents
                  </th>
                  <th scope="col" className="numeric">
                    Passages
                  </th>
                  <th scope="col">Newest</th>
                  <th scope="col" className="numeric">
                    Cited, 30 d
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => (
                  <tr key={collection.id}>
                    <td>
                      <Link
                        href={`/app/knowledge/documents?collection=${collection.id}`}
                        style={{ fontWeight: 500, color: "var(--ink)" }}
                      >
                        {collection.name}
                      </Link>
                      <br />
                      <span className="muted-3">
                        {collection.description} · {collection.owner}
                      </span>
                    </td>
                    <td className="numeric">{collection.documents}</td>
                    <td className="numeric">{formatNumber(collection.passages)}</td>
                    <td>{collection.newest}</td>
                    <td className="numeric">{collection.cited30d ?? "—"}</td>
                    <td>
                      <CollectionStatus collection={collection} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">Needs attention</h2>
            <div className="stack-4">
              {knowledge.needsAttention.map((item) => (
                <div key={item.label} className="stack-2">
                  <p className="section-label">{item.label}</p>
                  <p className="caption">{item.detail}</p>
                  {item.actionLabel ? (
                    <p>
                      <Link href="/app/knowledge/documents">{item.actionLabel}</Link>
                    </p>
                  ) : null}
                </div>
              ))}
              <div className="stack-2">
                <p className="section-label">{knowledge.evaluationLine.label}</p>
                <p className="caption">{knowledge.evaluationLine.detail}</p>
                <p>
                  <Link href="/app/evaluations">{knowledge.evaluationLine.actionLabel}</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

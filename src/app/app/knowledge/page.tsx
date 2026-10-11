import Link from "next/link";
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
        <div
          className="progress-track"
          role="img"
          aria-label={`Indexing ${percent}% complete`}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="caption">{percent}% complete</span>
      </div>
    );
  }
  if (status.type === "stale") {
    return <span className="warn-text">{status.label}</span>;
  }
  return <span>{status.label}</span>;
}

export default function KnowledgePage() {
  const knowledge = getKnowledge();
  const { collections } = knowledge;
  const totalDocuments = collections.reduce((total, c) => total + c.documents, 0);
  const totalPassages = collections.reduce((total, c) => total + c.passages, 0);
  const indexing = collections.find((c) => c.status.type === "indexing");
  const stale = collections.find((c) => c.status.type === "stale");

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Knowledge</h1>
        <p className="summary-sentence">
          {collections.length} collections hold {totalDocuments} documents and{" "}
          {formatNumber(totalPassages)} passages.
          {indexing
            ? ` ${indexing.name} is still indexing at ${indexing.status.percent ?? 0}%.`
            : ""}
          {stale ? ` ${stale.name} has ${stale.status.label.charAt(0).toLowerCase()}${stale.status.label.slice(1)}.` : ""}
        </p>
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
                    Cited 30d
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
                    </td>
                    <td className="numeric">{collection.documents}</td>
                    <td className="numeric">{formatNumber(collection.passages)}</td>
                    <td>{collection.newest}</td>
                    <td className="numeric">{collection.cited30d}</td>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

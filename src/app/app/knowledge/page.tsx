import Link from "next/link";
import { Button, ButtonLink } from "../../../components/Button";
import { getKnowledge } from "../../../lib/api";
import { formatNumber } from "../../../lib/utils";
import type { Collection } from "../../../lib/types";

const ROW_GRID = "minmax(0, 1fr) 80px 90px 110px 100px 170px";

function CollectionStatus({ collection }: { collection: Collection }) {
  const { status } = collection;
  if (status.type === "indexing") {
    const percent = status.percent ?? 0;
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span>{status.label}</span>
        <span className="progress-track" role="img" aria-label={`Indexing ${percent}% complete`}>
          <span className="progress-fill" style={{ display: "block", width: `${percent}%` }} />
        </span>
        {status.note ? (
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{status.note}</span>
        ) : null}
      </span>
    );
  }
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span>{status.label}</span>
      {status.note ? (
        <span style={{ fontSize: 12, color: "var(--warn)" }}>{status.note}</span>
      ) : null}
    </span>
  );
}

export default function KnowledgePage() {
  const knowledge = getKnowledge();
  const { collections } = knowledge;

  return (
    <div style={{ maxWidth: 1080 }}>
      <div
        className="page-head"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "var(--space-4)",
        }}
      >
        <div className="stack-3" style={{ maxWidth: 620 }}>
          <h1 className="page-title">Knowledge bases</h1>
          <p className="summary-sentence">{knowledge.summary}</p>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
          <ButtonLink href="/app/knowledge/documents" variant="secondary" size="sm">
            Upload documents
          </ButtonLink>
          <Button variant="primary" size="sm">
            New knowledge base
          </Button>
        </div>
      </div>

      <div className="doc-margin">
        <div role="table" aria-label="Knowledge bases" style={{ flex: "1 1 640px", minWidth: 0, overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div
              role="row"
              style={{
                display: "grid",
                gridTemplateColumns: ROW_GRID,
                gap: 18,
                padding: "0 0 8px",
                fontSize: 12,
                color: "var(--ink-4)",
              }}
            >
              <span role="columnheader">Collection</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Documents
              </span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Passages
              </span>
              <span role="columnheader">Newest</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Cited, 30 d
              </span>
              <span role="columnheader">Status</span>
            </div>
            {collections.map((collection, index) => (
              <Link
                key={collection.id}
                role="row"
                href="/app/knowledge/documents"
                style={{
                  display: "grid",
                  gridTemplateColumns: ROW_GRID,
                  gap: 18,
                  alignItems: "start",
                  padding: "13px 0",
                  borderTop: "1px solid var(--rule)",
                  borderBottom: index === collections.length - 1 ? "1px solid var(--rule)" : undefined,
                  textDecoration: "none",
                  color: "var(--ink)",
                  fontSize: 13,
                }}
              >
                <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <b style={{ fontSize: 14, fontWeight: 500 }}>{collection.name}</b>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {collection.description} · {collection.owner}
                  </span>
                </span>
                <span role="cell" style={{ textAlign: "right" }}>
                  {collection.documents}
                </span>
                <span role="cell" style={{ textAlign: "right" }}>
                  {formatNumber(collection.passages)}
                </span>
                <span role="cell">{collection.newest}</span>
                <span
                  role="cell"
                  style={{
                    textAlign: "right",
                    color: collection.cited30d == null ? "var(--ink-4)" : undefined,
                  }}
                >
                  {collection.cited30d ?? "—"}
                </span>
                <span role="cell">
                  <CollectionStatus collection={collection} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside aria-label="Needs attention" className="margin-column" style={{ gap: 18 }}>
          <h2 className="margin-box-title">Needs attention</h2>
          {knowledge.needsAttention.map((item, index) => (
            <section
              key={item.label}
              className="stack-2"
              style={
                index > 0
                  ? { borderTop: "1px solid var(--rule)", paddingTop: "var(--space-4)" }
                  : undefined
              }
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{item.label}</p>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>{item.detail}</p>
              {item.actionLabel ? (
                <p style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <Link href="/app/knowledge/documents">{item.actionLabel}</Link>
                </p>
              ) : null}
            </section>
          ))}
          <section
            className="stack-2"
            style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--space-4)" }}
          >
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
              {knowledge.evaluationLine.label}
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
              {knowledge.evaluationLine.detail}
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.5 }}>
              <Link href="/app/evaluations">{knowledge.evaluationLine.actionLabel}</Link>
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

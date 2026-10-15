import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { KnowledgeSubnav } from "../../../components/KnowledgeSubnav";
import { getKnowledge } from "../../../lib/api";
import type { Collection } from "../../../lib/types";
import { formatNumber } from "../../../lib/utils";

export const metadata: Metadata = { title: { absolute: "Cortex — Knowledge bases" } };

function CollectionStatus({ collection }: { collection: Collection }) {
  const { status } = collection;
  if (status.type === "indexing") {
    const percent = status.percent ?? 0;
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="pv-dot pv-dot-hollow" aria-hidden="true" />
          {status.label}
        </span>
        <span className="pv-bar" role="img" aria-label={`Indexing ${percent}% complete`}>
          <i style={{ width: `${percent}%` }} />
        </span>
        {status.note ? <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{status.note}</span> : null}
      </span>
    );
  }
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span className="pv-dot" aria-hidden="true" />
        {status.label}
      </span>
      {status.note ? <span style={{ fontSize: 11.5, lineHeight: 1.35, color: "var(--warn)" }}>{status.note}</span> : null}
    </span>
  );
}

export default function KnowledgePage() {
  const knowledge = getKnowledge();
  const { collections } = knowledge;

  return (
    <>
      <KnowledgeSubnav current="/app/knowledge" />
      <header className="pv-ph" style={{ alignItems: "flex-end", padding: "22px 28px" }}>
        <div className="pv-ph-title" style={{ gap: 10, maxWidth: 680 }}>
          <h1>Knowledge bases</h1>
          <p className="pv-lede">{knowledge.summary}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <ButtonLink href="/app/knowledge/documents" variant="secondary">
            <Icon name="upload" style={{ color: "var(--ink-2)" }} />
            Upload documents
          </ButtonLink>
          <Button variant="primary">
            <Icon name="plus" strokeWidth={1.8} style={{ color: "currentColor", width: 14, height: 14 }} />
            New knowledge base
          </Button>
        </div>
      </header>

      <div className="pv-split">
        <div style={{ padding: "24px 24px 32px 28px", minWidth: 0 }} className="pv-split-main">
          <div role="table" aria-label="Knowledge bases" className="pv-card pv-rows" style={{ overflow: "hidden" }}>
            <div role="row" className="pv-row pv-kr pv-th pv-stack pv-row-head" style={{ paddingTop: 12, paddingBottom: 12 }}>
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
            {collections.map((collection) => {
              const indexing = collection.status.type === "indexing";
              return (
                <Link
                  key={collection.id}
                  role="row"
                  href="/app/knowledge/documents"
                  className="pv-row pv-kr pv-stack"
                  style={indexing ? { background: "var(--side)" } : undefined}
                >
                  <span role="cell" style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                    <span className={indexing ? "pv-ib pv-ib-ln" : "pv-ib"} aria-hidden="true" style={{ width: 32, height: 32 }}>
                      <Icon name="database" />
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <b style={{ font: "600 16px/1.2 var(--font-serif)" }}>{collection.name}</b>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {collection.description} · {collection.owner}
                      </span>
                    </span>
                  </span>
                  <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
                    <span className="pv-row-cell-label">Documents</span>
                    {collection.documents}
                  </span>
                  <span role="cell" className="pv-mono" style={{ textAlign: "right" }}>
                    <span className="pv-row-cell-label">Passages</span>
                    {formatNumber(collection.passages)}
                  </span>
                  <span role="cell" style={{ color: "var(--ink-2)" }}>
                    <span className="pv-row-cell-label">Newest</span>
                    {collection.newest}
                  </span>
                  <span
                    role="cell"
                    className={collection.cited30d == null ? undefined : "pv-mono"}
                    style={{ textAlign: "right", color: collection.cited30d == null ? "var(--ink-4)" : undefined }}
                  >
                    <span className="pv-row-cell-label">Cited, 30 d</span>
                    {collection.cited30d ?? "—"}
                  </span>
                  <span role="cell">
                    <CollectionStatus collection={collection} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside aria-label="Needs attention" className="pv-side">
          <h2 className="pv-lbl" style={{ marginBottom: 4 }}>
            Needs attention
          </h2>
          {knowledge.needsAttention.map((item, index) => {
            const stale = index === 0;
            return (
              <section key={item.label} className="pv-att" style={stale ? { boxShadow: "var(--shadow-lift)" } : undefined}>
                <b>
                  <span className={stale ? "pv-dot pv-dot-warn" : "pv-dot pv-dot-hollow"} aria-hidden="true" />
                  {item.label}
                </b>
                <span>{item.detail}</span>
                {item.actionLabel ? <Link href="/app/knowledge/documents">{item.actionLabel} →</Link> : null}
              </section>
            );
          })}
          <section className="pv-att">
            <b>
              <Icon name="check" strokeWidth={1.8} style={{ width: 13, height: 13, color: "var(--ink)" }} />
              {knowledge.evaluationLine.label}
            </b>
            <span>{knowledge.evaluationLine.detail}</span>
            <Link href="/app/evaluations">{knowledge.evaluationLine.actionLabel} →</Link>
          </section>
        </aside>
      </div>
    </>
  );
}

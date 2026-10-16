import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "../../../components/Button";
import { IconCheck, IconDatabase } from "../../../components/icons";
import { getKnowledge } from "../../../lib/api";
import { formatNumber } from "../../../lib/utils";
import type { Collection } from "../../../lib/types";

export const metadata: Metadata = { title: { absolute: "Cortex — Knowledge bases" } };

function KnowledgeSubnav({ current }: { current: "bases" | "documents" | "ask" }) {
  return (
    <nav className="subnav" aria-label="Knowledge">
      <Link href="/app/knowledge" aria-current={current === "bases" ? "page" : undefined}>
        Knowledge bases
      </Link>
      <Link
        href="/app/knowledge/documents"
        aria-current={current === "documents" ? "page" : undefined}
      >
        Documents
      </Link>
      <Link href="/app/knowledge/ask" aria-current={current === "ask" ? "page" : undefined}>
        Ask
      </Link>
    </nav>
  );
}

function IconUpload() {
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M3 13.5h10" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function CollectionStatus({ collection }: { collection: Collection }) {
  const { status } = collection;
  if (status.type === "indexing") {
    const percent = status.percent ?? 0;
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="kb-dot kb-dot-hollow" aria-hidden="true" />
          {status.label}
        </span>
        <span className="kb-bar" role="img" aria-label={`Indexing ${percent}% complete`}>
          <i style={{ width: `${percent}%` }} />
        </span>
        {status.note ? (
          <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{status.note}</span>
        ) : null}
      </span>
    );
  }
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span className="kb-dot" aria-hidden="true" />
        {status.label}
      </span>
      {status.note ? (
        <span style={{ fontSize: 11.5, lineHeight: 1.35, color: "var(--warn)" }}>{status.note}</span>
      ) : null}
    </span>
  );
}

export default function KnowledgePage() {
  const knowledge = getKnowledge();
  const { collections } = knowledge;

  return (
    <>
      <KnowledgeSubnav current="bases" />
      <header className="ph" style={{ alignItems: "flex-end", padding: "22px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 680 }}>
          <h1>Knowledge bases</h1>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--ink-body)",
            }}
          >
            {knowledge.summary}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ButtonLink href="/app/knowledge/documents">
            <IconUpload />
            Upload documents
          </ButtonLink>
          <Button variant="primary">
            <IconPlus />
            New knowledge base
          </Button>
        </div>
      </header>

      <div className="kb-split">
        <div className="kb-main-knowledge">
          <div className="table-scroll">
            <div role="table" aria-label="Knowledge bases" className="card kb-kr-table" style={{ overflow: "hidden" }}>
              <div role="row" className="kb-kr kb-kr-head th">
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
                    className="kb-kr"
                    href="/app/knowledge/documents"
                    style={indexing ? { background: "#fcfcfb" } : undefined}
                  >
                    <span role="cell" className="kb-coll-name">
                      <span className={indexing ? "kb-tile kb-tile-ln" : "kb-tile"} aria-hidden="true">
                        <IconDatabase />
                      </span>
                      <span className="kb-coll-text">
                        <b>{collection.name}</b>
                        <span>
                          {collection.description} · {collection.owner}
                        </span>
                      </span>
                    </span>
                    <span role="cell" className="mono" style={{ textAlign: "right" }}>
                      {collection.documents}
                    </span>
                    <span role="cell" className="mono" style={{ textAlign: "right" }}>
                      {formatNumber(collection.passages)}
                    </span>
                    <span role="cell" style={{ color: "var(--ink-2)" }}>
                      {collection.newest}
                    </span>
                    <span
                      role="cell"
                      className="mono"
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
                );
              })}
            </div>
          </div>
        </div>

        <aside aria-label="Needs attention" className="kb-side">
          <h2 className="lbl" style={{ marginBottom: 4 }}>
            Needs attention
          </h2>
          {knowledge.needsAttention.map((item, index) => (
            <section key={item.label} className={index === 0 ? "kb-att kb-att-lift" : "kb-att"}>
              <b>
                <span
                  className={index === 0 ? "kb-dot kb-dot-warn" : "kb-dot kb-dot-hollow"}
                  aria-hidden="true"
                />
                {item.label}
              </b>
              <span>{item.detail}</span>
              {item.actionLabel ? (
                <Link href="/app/knowledge/documents">{item.actionLabel} →</Link>
              ) : null}
            </section>
          ))}
          <section className="kb-att">
            <b>
              <IconCheck style={{ width: 13, height: 13, strokeWidth: 1.8, color: "var(--ink)" }} />
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

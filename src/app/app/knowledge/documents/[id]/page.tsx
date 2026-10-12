import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: { absolute: "Cortex — Passage inspector" } };
import { Button } from "../../../../../components/Button";
import { getKnowledge } from "../../../../../lib/api";

type Passage = {
  number: number;
  text: string;
  overlapPrefix?: string;
  overlapSuffix?: string;
  highlight?: string;
  selected?: boolean;
};

type SelectedPassage = {
  number: number;
  tokens: number;
  page: string;
  heading: string;
  usage: string;
  retrieved?: number;
  cited?: number;
  medianMatch?: string;
  recent?: Array<{ label: string; href: string }>;
};

function PassageText({ passage }: { passage: Passage }) {
  const { text, overlapPrefix, overlapSuffix, highlight } = passage;
  let rest = text;
  const nodes: ReactNode[] = [];
  let key = 0;

  if (overlapPrefix && rest.startsWith(overlapPrefix)) {
    nodes.push(
      <span key={key++} className="overlap-shade">
        {overlapPrefix}
      </span>,
    );
    rest = rest.slice(overlapPrefix.length);
  }
  let tail = "";
  if (overlapSuffix && rest.endsWith(overlapSuffix)) {
    tail = overlapSuffix;
    rest = rest.slice(0, rest.length - overlapSuffix.length);
  }
  if (highlight && rest.includes(highlight)) {
    const [before, after] = rest.split(highlight);
    nodes.push(
      <span key={key++}>
        {before}
        <mark>{highlight}</mark>
        {after}
      </span>,
    );
  } else if (rest) {
    nodes.push(<span key={key++}>{rest}</span>);
  }
  if (tail) {
    nodes.push(
      <span key={key++} className="overlap-shade">
        {tail}
      </span>,
    );
  }
  return <>{nodes}</>;
}

export default async function PassageInspectorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const knowledge = getKnowledge();
  const { inspector } = knowledge;

  // The design defines this inspector for the synthesis document only; any
  // other document id is a genuine not-found rather than synthesis content
  // presented under a different title.
  if (id !== inspector.documentId) {
    notFound();
  }

  const passages = inspector.passages as Passage[];
  const selected = inspector.selectedPassage as SelectedPassage;

  return (
    <>
      <header
        className="bleed-head"
        style={{
          paddingTop: 18,
          paddingBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 12, color: "var(--ink-3)" }}>
            <Link href="/app/knowledge/documents" style={{ color: "var(--ink-3)" }}>
              Documents
            </Link>{" "}
            / {inspector.collectionName}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 24,
              lineHeight: 1.15,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            {inspector.documentTitle}
          </h1>
          <p className="meta">
            {inspector.totalPassages} passages · {inspector.splitting} · {inspector.indexedLabel}
          </p>
        </div>
        <div className="row" style={{ gap: 6, alignItems: "center", flexWrap: "nowrap" }}>
          <label htmlFor="go-to-passage" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Go to passage
          </label>
          <input
            id="go-to-passage"
            className="field-control"
            style={{ width: 56, height: 30, minHeight: 30, padding: "0 8px", textAlign: "right" }}
            defaultValue={selected.number}
          />
          <Button variant="secondary" size="sm">
            Change splitting
          </Button>
        </div>
      </header>

      <div className="doc-margin" style={{ marginTop: 24 }}>
        <div style={{ flex: "1 1 480px", maxWidth: 660, minWidth: 0 }}>
          <h2
            className="section-label"
            style={{ fontSize: 13, marginLeft: 60, marginBottom: 4 }}
          >
            {inspector.sectionHeading}
          </h2>
          <div className="passage-list">
            {passages.map((passage) =>
              passage.selected ? (
                <div
                  key={passage.number}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0, 1fr)",
                    gap: "var(--space-4)",
                    margin: "0 -16px",
                    padding: 16,
                    border: "1px solid var(--ink)",
                    borderRadius: "var(--radius-m)",
                    background: "var(--paper)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink)",
                      fontWeight: 600,
                      paddingTop: 3,
                    }}
                  >
                    {passage.number}
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: "var(--ink)",
                    }}
                  >
                    <PassageText passage={passage} />
                  </p>
                </div>
              ) : (
                <div key={passage.number} className="passage-row">
                  <span className="passage-number" style={{ textAlign: "left" }}>
                    {passage.number}
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: "var(--ink-2)",
                    }}
                  >
                    <PassageText passage={passage} />
                  </p>
                </div>
              ),
            )}
          </div>
          <p
            className="caption"
            style={{ marginLeft: 60, marginTop: 12, color: "var(--ink-4)" }}
          >
            Grey shading marks text shared with the neighbouring passage.
          </p>
        </div>

        <div className="margin-column">
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
              Passage {selected.number}
            </h2>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr)",
                gap: "6px 14px",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <dt style={{ color: "var(--ink-4)" }}>Length</dt>
              <dd style={{ color: "var(--ink-2)" }}>{selected.tokens} tokens</dd>
              <dt style={{ color: "var(--ink-4)" }}>Pages</dt>
              <dd style={{ color: "var(--ink-2)" }}>{selected.page}</dd>
              <dt style={{ color: "var(--ink-4)" }}>Heading</dt>
              <dd style={{ color: "var(--ink-2)" }}>{selected.heading}</dd>
            </dl>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Last 30 days</h2>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Retrieved for{" "}
              <b style={{ color: "var(--ink)" }}>{selected.retrieved}</b> questions and cited in{" "}
              <b style={{ color: "var(--ink)" }}>{selected.cited}</b> answers. Median match{" "}
              {selected.medianMatch}.
            </p>
            {selected.recent ? (
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
                Most recent:{" "}
                {selected.recent.map((item, index) => (
                  <span key={item.label}>
                    {index > 0 ? ", " : null}
                    <Link href={item.href}>{item.label}</Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Adjust</h2>
            <div className="stack-2">
              <div>
                <Button variant="secondary" size="sm">
                  Split after &ldquo;deciding criterion&rdquo;
                </Button>
              </div>
              <div>
                <Button variant="secondary" size="sm">
                  Merge with 119
                </Button>
              </div>
              <div>
                <Button variant="secondary" size="sm">
                  Keep out of answers
                </Button>
              </div>
            </div>
            <p className="caption" style={{ color: "var(--ink-4)" }}>
              Changes re-index this document only and take about 20 seconds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

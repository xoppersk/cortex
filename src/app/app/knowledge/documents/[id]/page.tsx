import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "../../../../../components/Button";
import { Icon } from "../../../../../components/Icon";
import { KnowledgeSubnav } from "../../../../../components/KnowledgeSubnav";
import { getKnowledge } from "../../../../../lib/api";

export const metadata: Metadata = { title: { absolute: "Cortex — Passage inspector" } };

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
      <span key={key++} className="pv-ov">
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
      <span key={key++} className="pv-ov">
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
      <KnowledgeSubnav current="/app/knowledge/documents" />
      <header className="pv-ph" style={{ alignItems: "flex-end" }}>
        <div className="pv-ph-title">
          <span className="pv-ph-sub">
            <Link href="/app/knowledge/documents" style={{ textDecoration: "underline" }}>
              Documents
            </Link>
            <span className="pv-crumb-sep" aria-hidden="true">
              /
            </span>
            {inspector.collectionName}
          </span>
          <h1>{inspector.documentTitle}</h1>
          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12.5, color: "var(--ink-3)" }}>
            <span className="pv-chip pv-chip-sm">{inspector.totalPassages} passages</span>
            {inspector.splitting} · {inspector.indexedLabel}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label htmlFor="go-to-passage" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Go to passage
          </label>
          <input
            id="go-to-passage"
            className="pv-inp pv-mono"
            style={{ width: 64, height: 32, textAlign: "right" }}
            defaultValue={selected.number}
          />
          <Button variant="secondary">Change splitting</Button>
        </div>
      </header>

      <div className="pv-split">
        <section aria-label="Document passages" className="pv-chunk-main">
          <h2 className="pv-sec-title pv-chunk-heading">{inspector.sectionHeading}</h2>
          {passages.map((passage, index) => (
            <div
              key={passage.number}
              className={passage.selected ? "pv-ps pv-ps-selected" : "pv-ps"}
              aria-current={passage.selected ? "true" : undefined}
              style={
                !passage.selected && passages[index - 1]?.selected
                  ? { borderTop: 0 }
                  : index === passages.length - 1
                    ? { borderBottom: "1px dashed var(--control)" }
                    : undefined
              }
            >
              <span className="pv-ps-n">
                {passage.selected ? <span className="pv-ps-badge">{passage.number}</span> : passage.number}
              </span>
              <p>
                <PassageText passage={passage} />
              </p>
            </div>
          ))}
          <p className="pv-chunk-legend">
            <span aria-hidden="true" />
            Grey shading marks text shared with the neighbouring passage.
          </p>
        </section>

        <aside className="pv-side" aria-label={`Passage ${selected.number}`} style={{ paddingTop: 30, gap: 14 }}>
          <section className="pv-card" style={{ boxShadow: "var(--shadow-lift)", gap: 12 }}>
            <h2 className="pv-card-title">Passage {selected.number}</h2>
            <dl className="pv-dl">
              <dt>Length</dt>
              <dd className="pv-mono">{selected.tokens} tokens</dd>
              <dt>Pages</dt>
              <dd className="pv-mono">{selected.page}</dd>
              <dt>Heading</dt>
              <dd>{selected.heading}</dd>
            </dl>
          </section>
          <section className="pv-card">
            <h2 className="pv-lbl" style={{ fontSize: 11 }}>
              Last 30 days
            </h2>
            <span>
              Retrieved for <b>{selected.retrieved}</b> questions and cited in <b>{selected.cited}</b> answers. Median match{" "}
              <span className="pv-mono" style={{ color: "var(--ink)" }}>
                {selected.medianMatch}
              </span>
              .
            </span>
            {selected.recent ? (
              <span>
                Most recent:{" "}
                {selected.recent.map((item, index) => (
                  <span key={item.label}>
                    {index > 0 ? ", " : null}
                    <Link href={item.href}>{item.label}</Link>
                  </span>
                ))}
              </span>
            ) : null}
          </section>
          <section className="pv-card pv-adjust">
            <h2 className="pv-lbl" style={{ fontSize: 11, marginBottom: 2 }}>
              Adjust
            </h2>
            <Button variant="secondary">
              <Icon name="split" style={{ color: "var(--ink-2)" }} />
              Split after &ldquo;deciding criterion&rdquo;
            </Button>
            <Button variant="secondary">
              <Icon name="merge" style={{ color: "var(--ink-2)" }} />
              Merge with {selected.number + 1}
            </Button>
            <Button variant="secondary">
              <Icon name="ban" style={{ color: "var(--ink-2)" }} />
              Keep out of answers
            </Button>
            <span style={{ color: "var(--ink-4)", paddingTop: 2 }}>Changes re-index this document only and take about 20 seconds.</span>
          </section>
        </aside>
      </div>
    </>
  );
}

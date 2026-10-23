import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "../../../../../components/Button";
import { getDocumentInspector } from "../../../../../lib/api";
function KnowledgeSubnav() {
  return (
    <nav className="subnav" aria-label="Knowledge">
      <Link href="/app/knowledge">Knowledge bases</Link>
      <Link href="/app/knowledge/documents" aria-current="page">
        Documents
      </Link>
      <Link href="/app/knowledge/ask">Ask</Link>
    </nav>
  );
}

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
      <span key={key++} className="kb-ov">
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
      <span key={key++} className="kb-ov">
        {tail}
      </span>,
    );
  }
  return <>{nodes}</>;
}

function IconSplit() {
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M2.5 8h11M5.5 5 2.5 8l3 3M10.5 5l3 3-3 3" />
    </svg>
  );
}

function IconMerge() {
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M3 4.5h10M3 11.5h10M8 6v4" />
    </svg>
  );
}

function IconKeepOut() {
  return (
    <svg
      className="ic"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="m4.2 11.8 7.6-7.6" />
    </svg>
  );
}

export default async function PassageInspectorPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const found = await getDocumentInspector(id);
  if (!found || !found.document) {
    notFound();
  }
  const { inspector } = found;

  const passages = inspector.passages as Passage[];
  const selected = inspector.selectedPassage as SelectedPassage;
  const selectedIndex = passages.findIndex((passage) => passage.selected);

  return (
    <>
      <KnowledgeSubnav />
      <header className="ph" style={{ alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <span className="sub">
            <Link href="/app/knowledge/documents" style={{ color: "var(--ink-4)" }}>
              Documents
            </Link>{" "}
            <span className="sep">/</span> {inspector.collectionName}
          </span>
          <h1>{inspector.documentTitle}</h1>
          <span
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              fontSize: 12.5,
              color: "var(--ink-3)",
            }}
          >
            <span className="chip" style={{ height: 24 }}>
              {inspector.totalPassages} passages
            </span>
            {inspector.splitting} · {inspector.indexedLabel}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label htmlFor="jump" style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Go to passage
          </label>
          <input
            id="jump"
            type="text"
            defaultValue={selected.number}
            className="inp mono"
            style={{ width: 64, height: 32, textAlign: "right" }}
          />
          <Button>Change splitting</Button>
        </div>
      </header>

      <div className="kb-split">
        <section aria-label="Document passages" className="kb-main-inspector">
          <h2 className="kb-inspector-h2">{inspector.sectionHeading}</h2>
          {passages.map((passage, index) => {
            if (passage.selected) {
              return (
                <div key={passage.number} className="kb-ps kb-ps-selected" aria-current="true">
                  <span className="kb-ps-n">
                    <span className="kb-ps-n-chip">{passage.number}</span>
                  </span>
                  <p>
                    <PassageText passage={passage} />
                  </p>
                </div>
              );
            }
            return (
              <div
                key={passage.number}
                className={[
                  "kb-ps",
                  index === passages.length - 1 ? "kb-ps-last" : "",
                  index === selectedIndex + 1 ? "kb-ps-after-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="kb-ps-n">{passage.number}</span>
                <p>
                  <PassageText passage={passage} />
                </p>
              </div>
            );
          })}
          <p className="kb-overlap-note">
            <span className="kb-overlap-swatch" aria-hidden="true" />
            Grey shading marks text shared with the neighbouring passage.
          </p>
        </section>

        <aside className="kb-side" aria-label={`Passage ${selected.number}`} style={{ paddingTop: 30, gap: 14 }}>
          <section className="card kb-side-card card-lift" style={{ gap: 12 }}>
            <h2 className="kb-passage-card-title">Passage {selected.number}</h2>
            <dl className="kb-dl">
              <dt>Length</dt>
              <dd className="mono">{selected.tokens} tokens</dd>
              <dt>Pages</dt>
              <dd className="mono">{selected.page}</dd>
              <dt>Heading</dt>
              <dd>{selected.heading}</dd>
            </dl>
          </section>
          <section className="card kb-side-card">
            <h2 className="lbl" style={{ fontSize: 11 }}>
              Last 30 days
            </h2>
            {selected.retrieved != null && selected.cited != null ? (
              <>
                <span>
                  Retrieved for <b>{selected.retrieved}</b> questions and cited in{" "}
                  <b>{selected.cited}</b> answers. Median match{" "}
                  <span className="mono" style={{ color: "var(--ink)" }}>
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
              </>
            ) : (
              <span>{selected.usage}</span>
            )}
          </section>
          <section className="card kb-side-card">
            <h2 className="lbl" style={{ fontSize: 11, marginBottom: 2 }}>
              Adjust
            </h2>
            <Button className="kb-side-btn">
              <IconSplit />
              Split after &ldquo;deciding criterion&rdquo;
            </Button>
            <Button className="kb-side-btn">
              <IconMerge />
              Merge with 119
            </Button>
            <Button className="kb-side-btn">
              <IconKeepOut />
              Keep out of answers
            </Button>
            <span style={{ color: "var(--ink-4)", paddingTop: 2 }}>
              Changes re-index this document only and take about 20 seconds.
            </span>
          </section>
        </aside>
      </div>
    </>
  );
}

